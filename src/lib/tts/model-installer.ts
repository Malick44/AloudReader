import { CryptoDigestAlgorithm, digest as digestBytes } from 'expo-crypto';
import { File } from 'expo-file-system';
import * as FileSystem from 'expo-file-system/legacy';
import { unzip } from 'react-native-zip-archive';

import { ensureTtsLayout, getArchivePath, getModelDirectory, getTtsRootDirectory } from './file-layout';
import { TtsError, asTtsError } from './errors';
import { buildModelConfig, discoverFamilyAssets } from './model-validation';
import { getInstalledModel, removeInstalledModelFromRegistry, upsertInstalledModel } from './model-registry';
import { ensureDirectory, joinPath, listFilesRecursive, pathExists, removePath } from './path-utils';
import { InstalledModel, ModelCatalogEntry, TtsAssetPaths } from './types';

export type InstallModelParams = {
  model: ModelCatalogEntry;
  onStatus?: (status: string) => void;
};

type HuggingFaceModelInfo = {
  siblings?: Array<{ rfilename?: string }>;
};

const ESPEAK_SOURCE_REPO_ID = 'csukuangfj/vits-piper-en_US-amy-low';
const ESPEAK_SHARED_ROOT = 'shared';
const ESPEAK_SHARED_DIR_NAME = 'espeak-ng-data';
const ESPEAK_MARKERS = ['phontab', 'en_dict', 'lang/gmw/en'] as const;
const ESPEAK_DOWNLOAD_CONCURRENCY = 8;
const MAX_INLINE_SHA256_BYTES = 32 * 1024 * 1024;

function normalizeSha256(value: string): string {
  return value.trim().toLowerCase();
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function computeFileSha256(path: string): Promise<string> {
  const file = new File(path);
  const fileBytes = await file.arrayBuffer();
  const hash = await digestBytes(CryptoDigestAlgorithm.SHA256, new Uint8Array(fileBytes));
  return bufferToHex(hash);
}

async function verifySha256(path: string, expectedSha256: string, context: Record<string, unknown>): Promise<void> {
  const info = await FileSystem.getInfoAsync(path);
  const fileSize = info.exists && typeof info.size === 'number' ? info.size : 0;
  if (fileSize > MAX_INLINE_SHA256_BYTES) {
    // Hashing large model binaries by reading the full file can OOM on Android.
    // Skip strict verification for large files until streaming hash support is added.
    return;
  }

  const expected = normalizeSha256(expectedSha256);
  const actual = await computeFileSha256(path);
  if (actual !== expected) {
    throw new TtsError('DOWNLOAD_FAILED', `Checksum mismatch for ${path}.`, {
      ...context,
      expectedSha256: expected,
      actualSha256: actual,
      path,
    });
  }
}

function assertArtifactChecksumMapping(model: ModelCatalogEntry): void {
  const checksums = model.artifactChecksumsSha256;
  if (!checksums || Object.keys(checksums).length === 0) {
    return;
  }

  if (!model.artifactUrls || Object.keys(model.artifactUrls).length === 0) {
    throw new TtsError(
      'INVALID_INPUT',
      `artifactChecksumsSha256 is configured for ${model.id} but artifactUrls is empty.`
    );
  }

  for (const relativePath of Object.keys(checksums)) {
    if (!model.artifactUrls[relativePath]) {
      throw new TtsError(
        'INVALID_INPUT',
        `Checksum path "${relativePath}" has no matching artifactUrl in model ${model.id}.`
      );
    }
  }
}

async function resolveInstalledMatchaVocoderPath(installed: InstalledModel): Promise<string | undefined> {
  const explicitPath = installed.config.assets.configPath;
  if (explicitPath?.toLowerCase().endsWith('.onnx')) {
    return explicitPath;
  }

  const onnxFiles = (await listFilesRecursive(installed.installDir))
    .filter((file) => file.toLowerCase().endsWith('.onnx'))
    .sort((a, b) => a.localeCompare(b));

  return onnxFiles.find((file) => file !== installed.config.assets.modelPath);
}

export async function hasRequiredAssets(installed: InstalledModel): Promise<boolean> {
  const requiredPaths: string[] = [installed.config.assets.modelPath];

  switch (installed.family) {
    case 'piper':
    case 'vits': {
      if (!installed.config.assets.tokensPath) {
        return false;
      }
      requiredPaths.push(installed.config.assets.tokensPath);
      break;
    }
    case 'kokoro': {
      if (!installed.config.assets.tokensPath || !installed.config.assets.voicesPath) {
        return false;
      }
      requiredPaths.push(installed.config.assets.tokensPath, installed.config.assets.voicesPath);
      break;
    }
    case 'matcha': {
      if (!installed.config.assets.tokensPath) {
        return false;
      }
      const vocoderPath = await resolveInstalledMatchaVocoderPath(installed);
      if (!vocoderPath) {
        return false;
      }
      requiredPaths.push(installed.config.assets.tokensPath, vocoderPath);
      break;
    }
    default:
      return false;
  }

  if (installed.config.assets.dataDirPath) {
    requiredPaths.push(installed.config.assets.dataDirPath);
  }

  for (const path of requiredPaths) {
    const exists = await pathExists(path);
    if (!exists) {
      return false;
    }
  }

  return true;
}

async function removeInstalledEntry(modelId: string): Promise<void> {
  try {
    await removeInstalledModelFromRegistry(modelId);
  } catch {
    // Best-effort cleanup; install will recreate the registry entry.
  }
}

function getSharedRootDirectory(): string {
  return joinPath(getTtsRootDirectory(), ESPEAK_SHARED_ROOT);
}

function getSharedEspeakDirectory(): string {
  return joinPath(getSharedRootDirectory(), ESPEAK_SHARED_DIR_NAME);
}

function encodePathSegments(path: string): string {
  return path.split('/').map(encodeURIComponent).join('/');
}

function toHuggingFaceResolveUrl(repoId: string, relativePath: string): string {
  return `https://huggingface.co/${repoId}/resolve/main/${encodePathSegments(relativePath)}?download=true`;
}

async function hasSharedEspeakData(sharedDir: string): Promise<boolean> {
  for (const marker of ESPEAK_MARKERS) {
    const exists = await pathExists(joinPath(sharedDir, marker));
    if (!exists) {
      return false;
    }
  }

  return true;
}

async function listEspeakFilesFromHuggingFace(repoId: string): Promise<string[]> {
  const response = await fetch(`https://huggingface.co/api/models/${repoId}`);
  if (!response.ok) {
    throw new TtsError('DOWNLOAD_FAILED', `Failed to query Hugging Face model files for ${repoId}.`, {
      repoId,
      status: response.status,
    });
  }

  const payload = (await response.json()) as HuggingFaceModelInfo;
  const files = (payload.siblings ?? [])
    .map((entry) => entry.rfilename)
    .filter((path): path is string => Boolean(path && path.startsWith('espeak-ng-data/')));

  if (files.length === 0) {
    throw new TtsError('DOWNLOAD_FAILED', `No espeak-ng-data files found for ${repoId}.`, { repoId });
  }

  return files;
}

async function ensureSharedEspeakData(onStatus?: (status: string) => void): Promise<string> {
  const sharedDir = getSharedEspeakDirectory();
  if (await hasSharedEspeakData(sharedDir)) {
    return sharedDir;
  }

  onStatus?.('downloading-espeak-data');
  await removePath(sharedDir);
  await ensureDirectory(sharedDir);

  const sharedRoot = getSharedRootDirectory();
  const files = await listEspeakFilesFromHuggingFace(ESPEAK_SOURCE_REPO_ID);

  for (let index = 0; index < files.length; index += ESPEAK_DOWNLOAD_CONCURRENCY) {
    const batch = files.slice(index, index + ESPEAK_DOWNLOAD_CONCURRENCY);
    await Promise.all(
      batch.map(async (relativePath) => {
        const targetPath = joinPath(sharedRoot, relativePath);
        const targetDir = targetPath.split('/').slice(0, -1).join('/');
        await ensureDirectory(targetDir);

        const download = await FileSystem.downloadAsync(
          toHuggingFaceResolveUrl(ESPEAK_SOURCE_REPO_ID, relativePath),
          targetPath
        );
        if (download.status !== 200) {
          throw new TtsError('DOWNLOAD_FAILED', `espeak-ng-data download failed with status ${download.status}.`, {
            relativePath,
            status: download.status,
          });
        }
      })
    );
  }

  if (!(await hasSharedEspeakData(sharedDir))) {
    throw new TtsError('DOWNLOAD_FAILED', 'espeak-ng-data download completed but required marker files are missing.');
  }

  return sharedDir;
}

async function withSupplementalAssets(
  model: ModelCatalogEntry,
  assets: TtsAssetPaths,
  onStatus?: (status: string) => void
): Promise<TtsAssetPaths> {
  if ((model.family !== 'piper' && model.family !== 'vits') || assets.dataDirPath) {
    return assets;
  }

  const dataDirPath = await ensureSharedEspeakData(onStatus);
  return {
    ...assets,
    dataDirPath,
  };
}

async function computeDirectorySize(path: string): Promise<number> {
  const files = await listFilesRecursive(path);
  let total = 0;
  for (const file of files) {
    const info = await FileSystem.getInfoAsync(file);
    total += info.exists && typeof info.size === 'number' ? info.size : 0;
  }
  return total;
}

async function downloadArchive(model: ModelCatalogEntry): Promise<string> {
  if (model.localArchivePath) {
    const exists = await pathExists(model.localArchivePath);
    if (!exists) {
      throw new TtsError('DOWNLOAD_FAILED', `Local archive does not exist: ${model.localArchivePath}`);
    }

    if (model.checksumSha256) {
      await verifySha256(model.localArchivePath, model.checksumSha256, {
        modelId: model.id,
        artifact: 'localArchivePath',
      });
    }

    return model.localArchivePath;
  }

  if (!model.archiveUrl) {
    throw new TtsError(
      'INVALID_INPUT',
      `No archiveUrl/localArchivePath/artifactUrls configured for ${model.id}. Update src/lib/tts/catalog.ts.`
    );
  }

  const target = getArchivePath(model.id);
  const download = await FileSystem.downloadAsync(model.archiveUrl, target);
  if (download.status !== 200) {
    throw new TtsError('DOWNLOAD_FAILED', `Archive download failed with status ${download.status}.`, {
      url: model.archiveUrl,
    });
  }

  if (model.checksumSha256) {
    await verifySha256(download.uri, model.checksumSha256, {
      modelId: model.id,
      artifact: 'archiveUrl',
      url: model.archiveUrl,
    });
  }

  return download.uri;
}

async function downloadArtifacts(model: ModelCatalogEntry, modelDirectory: string): Promise<void> {
  if (!model.artifactUrls || Object.keys(model.artifactUrls).length === 0) {
    return;
  }

  assertArtifactChecksumMapping(model);

  for (const [relativePath, url] of Object.entries(model.artifactUrls)) {
    const targetPath = joinPath(modelDirectory, relativePath);
    const targetDir = targetPath.split('/').slice(0, -1).join('/');
    await ensureDirectory(targetDir);

    const result = await FileSystem.downloadAsync(url, targetPath);
    if (result.status !== 200) {
      throw new TtsError('DOWNLOAD_FAILED', `Artifact download failed with status ${result.status}.`, {
        url,
        relativePath,
      });
    }

    const expectedSha256 = model.artifactChecksumsSha256?.[relativePath];
    if (expectedSha256) {
      await verifySha256(targetPath, expectedSha256, {
        modelId: model.id,
        artifact: relativePath,
        url,
      });
    }
  }
}

async function extractArchiveIfConfigured(model: ModelCatalogEntry, modelDirectory: string): Promise<void> {
  if (!model.archiveUrl && !model.localArchivePath) {
    return;
  }

  const archivePath = await downloadArchive(model);
  if (!archivePath.endsWith('.zip')) {
    throw new TtsError(
      'UNSUPPORTED_ARCHIVE',
      'Only .zip archives are supported by default. Add extractor wiring for other archive types.'
    );
  }

  await unzip(archivePath, modelDirectory);
}

export async function installModel(params: InstallModelParams): Promise<InstalledModel> {
  const { model, onStatus } = params;

  onStatus?.('checking-registry');
  const existing = await getInstalledModel(model.id);
  if (existing) {
    if (await hasRequiredAssets(existing)) {
      onStatus?.('already-installed');
      return existing;
    }

    onStatus?.('repairing-stale-install');
    await removePath(existing.installDir);
    await removeInstalledEntry(existing.modelId);
  }

  await ensureTtsLayout();
  const modelDirectory = getModelDirectory(model.family, model.id);

  try {
    onStatus?.('preparing-directories');
    await removePath(modelDirectory);
    await ensureDirectory(modelDirectory);

    onStatus?.('downloading-and-extracting');
    await extractArchiveIfConfigured(model, modelDirectory);
    await downloadArtifacts(model, modelDirectory);

    onStatus?.('validating-model-files');
    const discoveredAssets = await discoverFamilyAssets(model.family, modelDirectory);
    const assets = await withSupplementalAssets(model, discoveredAssets, onStatus);
    const config = buildModelConfig({
      id: model.id,
      family: model.family,
      language: model.language,
      displayName: model.displayName,
      installDir: modelDirectory,
      assets,
    });

    const sizeBytes = await computeDirectorySize(modelDirectory);
    const installed: InstalledModel = {
      modelId: model.id,
      family: model.family,
      language: model.language,
      displayName: model.displayName,
      installDir: modelDirectory,
      installedAt: new Date().toISOString(),
      sizeBytes,
      config,
    };

    onStatus?.('writing-registry');
    await upsertInstalledModel(installed);

    onStatus?.('complete');
    return installed;
  } catch (error) {
    await removePath(modelDirectory);
    throw asTtsError(error, 'INSTALL_FAILED', `Failed to install model: ${model.id}`, { modelId: model.id });
  }
}

export async function uninstallModelFiles(modelId: string): Promise<void> {
  const installed = await getInstalledModel(modelId);
  if (!installed) {
    throw new TtsError('MODEL_NOT_FOUND', `Model not installed: ${modelId}`);
  }

  await removePath(installed.installDir);
  await removeInstalledModelFromRegistry(modelId);
}

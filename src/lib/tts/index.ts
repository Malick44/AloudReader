import ExpoLocalTtsModule, {
  EngineStatusNative,
  NativeSpeakOptions,
  NativeTtsModelConfig,
} from '../../../modules/expo-local-tts';

import { DEFAULT_LANGUAGE, INITIAL_MODEL_ID } from './constants';
import { TtsError, asTtsError } from './errors';
import { speakWithSystemTts, stopSystemTts } from './fallback';
import { hasRequiredAssets, installModel, uninstallModelFiles } from './model-installer';
import { getInstalledModel, listInstalledModelsFromRegistry } from './model-registry';
import { synthesizeToFileNative } from './native-synthesis';
import { localModelCatalog } from './catalog';
import {
  EngineStatus,
  InstalledModel,
  ModelCatalogEntry,
  PipelineOptions,
  SpeakOptions,
  SynthesizeOptions,
  TtsModelConfig,
} from './types';

export * from './types';
export * from './model-installer';
export * from './model-registry';
export * from './catalog';
export * from './pipeline';
export * from './audioSession';
export * from './trackPlayer';
export * from './playback-rate';
export * from './language-routing';
export * from './cache';
export * from './qa';

function toNativeConfig(config: TtsModelConfig): NativeTtsModelConfig {
  const assets: NativeTtsModelConfig['assets'] = {
    modelPath: config.assets.modelPath,
    ...(config.assets.tokensPath ? { tokensPath: config.assets.tokensPath } : {}),
    ...(config.assets.dataDirPath ? { dataDirPath: config.assets.dataDirPath } : {}),
    ...(config.assets.lexiconPath ? { lexiconPath: config.assets.lexiconPath } : {}),
    ...(config.assets.ruleFstsPaths?.length ? { ruleFstsPaths: config.assets.ruleFstsPaths } : {}),
    ...(config.assets.configPath ? { configPath: config.assets.configPath } : {}),
    ...(config.assets.voicesPath ? { voicesPath: config.assets.voicesPath } : {}),
  };

  return {
    id: config.id,
    family: config.family,
    language: config.language,
    displayName: config.displayName,
    sampleRate: config.sampleRate,
    installDir: config.installDir,
    assets,
  };
}

let defaultModelBootstrapPromise: Promise<InstalledModel> | null = null;

function toNativeSpeakOptions(options: SpeakOptions): NativeSpeakOptions {
  return {
    modelId: options.modelId,
    language: options.language,
    rate: options.rate,
    pitch: options.pitch,
    volume: options.volume,
  };
}

function mapEngineStatus(status: EngineStatusNative): EngineStatus {
  return {
    backend: 'sherpa-onnx-local-module',
    available: status.available,
    initializedModelIds: status.initializedModelIds,
    message: status.message,
  };
}

async function cleanupStaleInstall(modelId: string): Promise<void> {
  await Promise.allSettled([ExpoLocalTtsModule.uninstallModel(modelId), uninstallModelFiles(modelId)]);
}

async function repairFromCatalog(modelId: string): Promise<InstalledModel> {
  const entry = localModelCatalog.find((item) => item.id === modelId);
  if (!entry) {
    throw new TtsError(
      'MODEL_VALIDATION_FAILED',
      `Installed model files are missing and no catalog repair source exists for model: ${modelId}`
    );
  }

  await cleanupStaleInstall(modelId);
  return installModel({ model: entry });
}

export async function initialize(config: TtsModelConfig): Promise<void> {
  try {
    await ExpoLocalTtsModule.initialize(toNativeConfig(config));
  } catch (error) {
    throw asTtsError(error, 'NATIVE_FAILURE', `Failed to initialize model ${config.id}.`);
  }
}

export async function preloadModels(configs: TtsModelConfig[]): Promise<void> {
  try {
    await ExpoLocalTtsModule.preloadModels(configs.map(toNativeConfig));
  } catch (error) {
    throw asTtsError(error, 'NATIVE_FAILURE', 'Failed to preload local TTS models.');
  }
}

export async function synthesizeToFile(text: string, options: SynthesizeOptions): Promise<string> {
  return synthesizeToFileNative(text, options);
}

export async function speak(text: string, options: SpeakOptions = {}): Promise<void> {
  if (!text.trim()) {
    throw new TtsError('INVALID_INPUT', 'Cannot speak empty text.');
  }

  const shouldFallback = options.fallbackToSystemTts ?? true;

  try {
    await ExpoLocalTtsModule.speak(text, toNativeSpeakOptions(options));
    return;
  } catch (error) {
    if (!shouldFallback) {
      throw asTtsError(error, 'NATIVE_FAILURE', 'Native speak() failed and fallback is disabled.');
    }
  }

  await speakWithSystemTts(text, {
    ...options,
    language: options.language ?? DEFAULT_LANGUAGE,
  });
}

export async function stop(): Promise<void> {
  await Promise.allSettled([ExpoLocalTtsModule.stop(), stopSystemTts()]);
}

export async function isReady(modelId: string): Promise<boolean> {
  return ExpoLocalTtsModule.isReady(modelId);
}

export async function listInstalledModels(): Promise<InstalledModel[]> {
  const installed = await listInstalledModelsFromRegistry();
  const healthy: InstalledModel[] = [];

  for (const model of installed) {
    if (await hasRequiredAssets(model)) {
      healthy.push(model);
      continue;
    }

    await cleanupStaleInstall(model.modelId);
  }

  return healthy;
}

export async function uninstallModel(modelId: string): Promise<void> {
  await ExpoLocalTtsModule.uninstallModel(modelId);
  await uninstallModelFiles(modelId);
}

export async function getEngineStatus(): Promise<EngineStatus> {
  try {
    const nativeStatus = await ExpoLocalTtsModule.getEngineStatus();
    return mapEngineStatus(nativeStatus);
  } catch {
    return {
      backend: 'sherpa-onnx-local-module',
      available: false,
      initializedModelIds: [],
      message: 'Native local TTS module unavailable in current runtime.',
    };
  }
}

export async function initializeInstalledModel(modelId: string): Promise<void> {
  let installed = await getInstalledModel(modelId);
  if (!installed) {
    throw new TtsError('MODEL_NOT_FOUND', `Model not installed: ${modelId}`);
  }

  if (!(await hasRequiredAssets(installed))) {
    installed = await repairFromCatalog(modelId);
  }

  await initialize(installed.config);
}

export async function installFromCatalog(
  modelId: string,
  onStatus?: (status: string) => void
): Promise<InstalledModel> {
  const model = localModelCatalog.find((entry) => entry.id === modelId);
  if (!model) {
    throw new TtsError('MODEL_NOT_FOUND', `Model does not exist in local catalog: ${modelId}`);
  }
  return installModel({ model, onStatus });
}

export async function installFromEntry(
  entry: ModelCatalogEntry,
  onStatus?: (status: string) => void
): Promise<InstalledModel> {
  return installModel({ model: entry, onStatus });
}

export async function ensureModelInstalled(
  modelId: string,
  onStatus?: (status: string) => void
): Promise<InstalledModel> {
  const existing = await getInstalledModel(modelId);
  if (existing && (await hasRequiredAssets(existing))) {
    onStatus?.('already-installed');
    return existing;
  }

  if (existing) {
    await cleanupStaleInstall(modelId);
  }

  return installFromCatalog(modelId, onStatus);
}

export async function ensureModelInitialized(
  modelId: string,
  onStatus?: (status: string) => void
): Promise<InstalledModel> {
  const installed = await ensureModelInstalled(modelId, onStatus);
  onStatus?.('initializing');
  await initialize(installed.config);
  onStatus?.('initialized');
  return installed;
}

export async function bootstrapDefaultModel(
  onStatus?: (status: string) => void
): Promise<InstalledModel> {
  if (!defaultModelBootstrapPromise) {
    defaultModelBootstrapPromise = ensureModelInitialized(INITIAL_MODEL_ID, onStatus).catch((error) => {
      defaultModelBootstrapPromise = null;
      throw error;
    });
  }

  return defaultModelBootstrapPromise;
}

export function toPipelineDefaults(modelId: string): PipelineOptions {
  return {
    modelId,
    language: DEFAULT_LANGUAGE,
    fallbackToSystemTts: true,
  };
}

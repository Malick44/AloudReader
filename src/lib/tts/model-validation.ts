import { DEFAULT_SAMPLE_RATE } from './constants';
import { TtsError } from './errors';
import { listFilesRecursive } from './path-utils';
import { TtsAssetPaths, TtsModelConfig, TtsModelFamily } from './types';

function findFile(files: string[], pattern: RegExp): string | undefined {
  return files.find((file) => pattern.test(file.toLowerCase()));
}

function findFiles(files: string[], pattern: RegExp): string[] {
  return files.filter((file) => pattern.test(file.toLowerCase()));
}

function selectMatchaAssets(onnxFiles: string[]): { modelPath: string; vocoderPath: string } | null {
  if (onnxFiles.length < 2) {
    return null;
  }

  const vocoderPath =
    onnxFiles.find((file) => /(vocoder|hifi-gan|hifigan|vocos)/.test(file.toLowerCase())) ??
    onnxFiles[1];

  const modelPath =
    onnxFiles.find(
      (file) =>
        file !== vocoderPath && /(acoustic|matcha|generator|tts|model)/.test(file.toLowerCase())
    ) ?? onnxFiles.find((file) => file !== vocoderPath);

  if (!modelPath) {
    return null;
  }

  return { modelPath, vocoderPath };
}

function findEspeakDataDirectory(files: string[]): string | undefined {
  const exact = findFile(files, /espeak-ng-data$/);
  if (exact) {
    return exact;
  }

  const nested = files.find((file) => file.toLowerCase().includes('/espeak-ng-data/'));
  if (!nested) {
    return undefined;
  }

  const marker = '/espeak-ng-data/';
  const markerIndex = nested.toLowerCase().indexOf(marker);
  if (markerIndex < 0) {
    return undefined;
  }

  return `${nested.slice(0, markerIndex)}${marker.slice(0, -1)}`;
}

export async function discoverFamilyAssets(
  family: TtsModelFamily,
  modelDir: string
): Promise<TtsAssetPaths> {
  const files = (await listFilesRecursive(modelDir)).sort((a, b) => a.localeCompare(b));
  const onnxFiles = findFiles(files, /\.onnx$/);
  if (onnxFiles.length === 0) {
    throw new TtsError('MODEL_VALIDATION_FAILED', `Missing ONNX model file for family: ${family}`);
  }

  const tokensPath = findFile(files, /(tokens|vocab).*\.(txt|json)$/);
  const lexiconPath = findFile(files, /lexicon\.(txt|json)$/);
  const ruleFstsPaths = findFiles(files, /\.(fst|fsttxt)$/);
  const dataDirPath = findEspeakDataDirectory(files);
  let configPath = findFile(files, /(config|voices)\.(json|yaml|yml)$/);
  const voicesPath = findFile(files, /(voices).*\.(bin|pt|onnx|json)$/);
  let modelPath = onnxFiles[0];

  if ((family === 'piper' || family === 'vits') && !tokensPath) {
    throw new TtsError('MODEL_VALIDATION_FAILED', `Missing token file for family: ${family}`);
  }

  if (family === 'kokoro' && (!tokensPath || !voicesPath)) {
    throw new TtsError('MODEL_VALIDATION_FAILED', 'Missing required kokoro assets (tokens and voices).');
  }

  if (family === 'matcha') {
    if (!tokensPath) {
      throw new TtsError('MODEL_VALIDATION_FAILED', 'Missing token file for family: matcha');
    }

    const matchaAssets = selectMatchaAssets(onnxFiles);
    if (!matchaAssets) {
      throw new TtsError(
        'MODEL_VALIDATION_FAILED',
        'Matcha install must include both acoustic and vocoder ONNX files.'
      );
    }

    modelPath = matchaAssets.modelPath;
    configPath = matchaAssets.vocoderPath;
  }

  return {
    modelPath,
    tokensPath,
    lexiconPath,
    ruleFstsPaths: ruleFstsPaths.length > 0 ? ruleFstsPaths : undefined,
    dataDirPath,
    configPath,
    voicesPath,
  };
}

export function buildModelConfig(input: {
  id: string;
  family: TtsModelFamily;
  language: string;
  displayName: string;
  installDir: string;
  assets: TtsAssetPaths;
}): TtsModelConfig {
  return {
    id: input.id,
    family: input.family,
    language: input.language,
    displayName: input.displayName,
    installDir: input.installDir,
    sampleRate: DEFAULT_SAMPLE_RATE,
    assets: input.assets,
  };
}

import ExpoLocalTtsModule, { NativeSynthesizeOptions } from '../../../modules/expo-local-tts';

import { TtsError, asTtsError } from './errors';
import { SynthesizeOptions } from './types';

function toNativeSynthesizeOptions(options: SynthesizeOptions): NativeSynthesizeOptions {
  return {
    modelId: options.modelId,
    outputPath: options.outputPath,
    speed: options.speed,
    speakerId: options.speakerId,
    language: options.language,
  };
}

function normalizeFileUri(path: string): string {
  if (path.startsWith('file://')) {
    return path;
  }
  if (path.startsWith('/')) {
    return `file://${path}`;
  }
  return path;
}

export async function synthesizeToFileNative(text: string, options: SynthesizeOptions): Promise<string> {
  if (!text.trim()) {
    throw new TtsError('INVALID_INPUT', 'Cannot synthesize empty text.');
  }

  try {
    const outputPath = await ExpoLocalTtsModule.synthesizeToFile(text, toNativeSynthesizeOptions(options));
    return normalizeFileUri(outputPath);
  } catch (error) {
    throw asTtsError(error, 'NATIVE_FAILURE', 'Native synthesizeToFile call failed.');
  }
}

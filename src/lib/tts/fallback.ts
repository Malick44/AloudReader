import * as Speech from 'expo-speech';

import { DEFAULT_LANGUAGE } from './constants';
import { SpeakOptions } from './types';

export async function speakWithSystemTts(text: string, options: SpeakOptions): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    Speech.speak(text, {
      language: options.language ?? DEFAULT_LANGUAGE,
      rate: options.rate,
      pitch: options.pitch,
      volume: options.volume,
      onDone: resolve,
      onStopped: resolve,
      onError: (error) => reject(new Error(error?.message ?? 'System TTS failed.')),
    });
  });
}

export async function stopSystemTts(): Promise<void> {
  await Speech.stop();
}

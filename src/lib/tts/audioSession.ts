import { setAudioModeAsync } from 'expo-audio';

import { asTtsError } from './errors';

let initializationPromise: Promise<void> | null = null;

export function initializeAudioSession(): Promise<void> {
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: true,
    interruptionMode: 'doNotMix',
    allowsRecording: false,
    shouldRouteThroughEarpiece: false,
  }).catch((error) => {
    initializationPromise = null;
    throw asTtsError(error, 'PLAYBACK_FAILED', 'Failed to initialize audio session.');
  });

  return initializationPromise;
}

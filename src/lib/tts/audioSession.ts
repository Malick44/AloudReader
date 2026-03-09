import { asTtsError } from './errors';
import { ensureTrackPlayerSetup } from './trackPlayer';

let initializationPromise: Promise<void> | null = null;

export function initializeAudioSession(): Promise<void> {
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = ensureTrackPlayerSetup().catch((error) => {
    initializationPromise = null;
    throw asTtsError(error, 'PLAYBACK_FAILED', 'Failed to initialize audio session.');
  });

  return initializationPromise;
}

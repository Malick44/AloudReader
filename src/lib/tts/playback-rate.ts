const MIN_PLAYBACK_RATE = 0.1;
const MAX_PLAYBACK_RATE = 2;
const UI_PLAYBACK_RATE_CALIBRATION = 0.92;

function clampPlaybackRate(rate: number): number {
  return Math.max(MIN_PLAYBACK_RATE, Math.min(rate, MAX_PLAYBACK_RATE));
}

export function normalizePlaybackRate(rate?: number): number {
  if (!Number.isFinite(rate)) {
    return 1;
  }

  return clampPlaybackRate(rate ?? 1);
}

export function getCalibratedPlaybackRateFromUiRate(rate: number): number {
  return clampPlaybackRate(normalizePlaybackRate(rate) * UI_PLAYBACK_RATE_CALIBRATION);
}

export function getNativeSynthesisSpeedFromUiRate(rate?: number): number | undefined {
  if (!Number.isFinite(rate)) {
    return undefined;
  }

  return getCalibratedPlaybackRateFromUiRate(rate ?? 1);
}

export function getTrackPlayerRateFromUiRate(
  rate?: number,
  options: { generatedSpeech?: boolean } = {}
): number {
  if (options.generatedSpeech) {
    return 1;
  }

  if (!Number.isFinite(rate)) {
    return 1;
  }

  return getCalibratedPlaybackRateFromUiRate(rate ?? 1);
}
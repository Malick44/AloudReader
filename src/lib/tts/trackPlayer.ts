import * as TrackPlayerModule from 'react-native-track-player/lib/src/trackPlayer';
import { APP_NAME } from './constants';
import { getTrackPlayerRateFromUiRate } from './playback-rate';
import type { PipelineChunkResult } from './types';

export const TrackPlayerEvent = {
  PlaybackQueueEnded: 'playback-queue-ended',
  PlaybackActiveTrackChanged: 'playback-active-track-changed',
  PlaybackState: 'playback-state',
  RemotePlay: 'remote-play',
  RemotePause: 'remote-pause',
  RemoteStop: 'remote-stop',
  RemoteNext: 'remote-next',
  RemotePrevious: 'remote-previous',
  RemoteSeek: 'remote-seek',
} as const;

export const TrackPlayerState = {
  None: 'none',
  Ready: 'ready',
  Playing: 'playing',
  Paused: 'paused',
  Stopped: 'stopped',
  Loading: 'loading',
  Buffering: 'buffering',
  Error: 'error',
  Ended: 'ended',
} as const;

type TrackPlayerEventName = (typeof TrackPlayerEvent)[keyof typeof TrackPlayerEvent];
type TrackPlayerStateName = (typeof TrackPlayerState)[keyof typeof TrackPlayerState];

type TrackLike = {
  id: string;
  url: string;
  title?: string;
  artist?: string;
  album?: string;
  description?: string;
  [key: string]: unknown;
};

type TrackPlayerModuleShape = {
  setupPlayer?: (options?: Record<string, unknown>) => Promise<void>;
  updateOptions?: (options?: Record<string, unknown>) => Promise<void>;
  load?: (track: TrackLike) => Promise<void>;
  /** Append a track to the end of the player queue (gapless). */
  add?: (track: TrackLike | TrackLike[], insertBeforeIndex?: number) => Promise<number | void>;
  reset?: () => Promise<void>;
  setRate?: (rate: number) => Promise<void>;
  play?: () => Promise<void>;
  pause?: () => Promise<void>;
  stop?: () => Promise<void>;
  seekTo?: (seconds: number) => Promise<void>;
  getProgress?: () => Promise<{ position: number; duration: number; buffered: number }>;
  getPlaybackState?: () => Promise<{ state: TrackPlayerStateName; error?: unknown }>;
  getActiveTrack?: () => Promise<TrackLike | undefined>;
  addEventListener?: (event: TrackPlayerEventName, listener: (payload?: any) => void) => { remove: () => void };
};

let setupPromise: Promise<void> | null = null;

function getTrackPlayerModule(): TrackPlayerModuleShape | null {
  if (!TrackPlayerModule || typeof TrackPlayerModule !== 'object') {
    return null;
  }
  return TrackPlayerModule as unknown as TrackPlayerModuleShape;
}

export function isTrackPlayerAvailable(): boolean {
  const moduleRef = getTrackPlayerModule();
  return Boolean(moduleRef?.setupPlayer);
}

function getUnavailableError(): Error {
  return new Error('Track Player native module unavailable. Rebuild the native app to enable playback.');
}

async function withTrackPlayer<T>(
  action: (moduleRef: TrackPlayerModuleShape) => Promise<T>,
  fallback: T
): Promise<T> {
  const moduleRef = getTrackPlayerModule();
  if (!moduleRef) {
    return fallback;
  }

  try {
    return await action(moduleRef);
  } catch {
    return fallback;
  }
}

export async function ensureTrackPlayerSetup(): Promise<void> {
  if (setupPromise) {
    return setupPromise;
  }

  setupPromise = (async () => {
    const moduleRef = getTrackPlayerModule();
    if (!moduleRef?.setupPlayer) {
      throw getUnavailableError();
    }

    await moduleRef.setupPlayer({
      autoHandleInterruptions: true,
      autoUpdateMetadata: true,
      // Keep a small buffer: local WAV files don't need large network buffers
      // and smaller values reduce the chance of underrun glitches on slow devices.
      minBuffer: 1,
      maxBuffer: 4,
      playBuffer: 0.5,
    });

    await moduleRef.updateOptions?.({
      progressUpdateEventInterval: 0.25,
    });
  })().catch((error) => {
    setupPromise = null;
    throw error;
  });

  return setupPromise;
}

export function createTrackPlayerTrack(
  item: PipelineChunkResult,
  metadata: {
    title?: string;
    artist?: string;
  }
): TrackLike {
  return {
    id: item.chunk.id,
    url: item.audioPath ?? '',
    title: metadata.title || APP_NAME,
    artist: metadata.artist || APP_NAME,
    album: APP_NAME,
    description: item.chunk.text,
    chunkIndex: item.chunk.index,
    chunkText: item.chunk.text,
  };
}

export async function loadChunkTrack(
  item: PipelineChunkResult,
  metadata: {
    title?: string;
    artist?: string;
  },
  rate?: number
): Promise<void> {
  await ensureTrackPlayerSetup();
  const moduleRef = getTrackPlayerModule();
  if (!moduleRef?.load) {
    throw getUnavailableError();
  }

  await moduleRef.load(createTrackPlayerTrack(item, metadata));
  await moduleRef.setRate?.(getTrackPlayerRateFromUiRate(rate, { generatedSpeech: true }));
}

/**
 * Append a chunk to the end of the player queue without interrupting the
 * currently-playing track.  ExoPlayer (Android) and AVQueuePlayer (iOS) will
 * transition gaplessly to it, keeping the same AudioTrack alive so there is
 * no hardware-level click between chunks.
 */
export async function addChunkTrack(
  item: PipelineChunkResult,
  metadata: {
    title?: string;
    artist?: string;
  }
): Promise<void> {
  await ensureTrackPlayerSetup();
  const moduleRef = getTrackPlayerModule();
  if (!moduleRef?.add) {
    throw getUnavailableError();
  }
  await moduleRef.add(createTrackPlayerTrack(item, metadata));
}

export async function playStandaloneFile(
  uri: string,
  metadata: {
    id?: string;
    title?: string;
    artist?: string;
  } = {},
  rate?: number,
  options: { generatedSpeech?: boolean } = {}
): Promise<void> {
  await ensureTrackPlayerSetup();
  const moduleRef = getTrackPlayerModule();
  if (!moduleRef?.load || !moduleRef.play) {
    throw getUnavailableError();
  }

  await moduleRef.reset?.();
  await moduleRef.load({
    id: metadata.id ?? 'standalone-preview',
    url: uri,
    title: metadata.title ?? APP_NAME,
    artist: metadata.artist ?? APP_NAME,
    album: APP_NAME,
  });
  await moduleRef.setRate?.(getTrackPlayerRateFromUiRate(rate, options));
  await moduleRef.play();
}

export async function pauseTrackPlayer(): Promise<void> {
  await withTrackPlayer(async (moduleRef) => {
    await moduleRef.pause?.();
  }, undefined);
}

export async function playTrackPlayer(): Promise<void> {
  await withTrackPlayer(async (moduleRef) => {
    await moduleRef.play?.();
  }, undefined);
}

export async function stopTrackPlayer(): Promise<void> {
  await withTrackPlayer(async (moduleRef) => {
    await moduleRef.stop?.();
    await moduleRef.reset?.();
  }, undefined);
}

export async function seekTrackPlayerTo(seconds: number): Promise<void> {
  await withTrackPlayer(async (moduleRef) => {
    await moduleRef.seekTo?.(seconds);
  }, undefined);
}

export async function setTrackPlayerRate(rate: number): Promise<void> {
  await withTrackPlayer(async (moduleRef) => {
    await moduleRef.setRate?.(getTrackPlayerRateFromUiRate(rate));
  }, undefined);
}

export async function getTrackPlayerProgress() {
  return await withTrackPlayer(
    async (moduleRef) => {
      return (await moduleRef.getProgress?.()) ?? { position: 0, duration: 0, buffered: 0 };
    },
    { position: 0, duration: 0, buffered: 0 }
  );
}

export async function getTrackPlayerPlaybackState() {
  return await withTrackPlayer(
    async (moduleRef) => {
      return (await moduleRef.getPlaybackState?.()) ?? { state: TrackPlayerState.None };
    },
    { state: TrackPlayerState.None }
  );
}

export async function getTrackPlayerActiveTrack() {
  return await withTrackPlayer(async (moduleRef) => {
    return await moduleRef.getActiveTrack?.();
  }, undefined);
}

export function addTrackPlayerListener(
  event: TrackPlayerEventName,
  listener: (payload?: any) => void
) {
  const moduleRef = getTrackPlayerModule();
  if (!moduleRef?.addEventListener) {
    return {
      remove() {
        // no-op
      },
    };
  }

  try {
    return moduleRef.addEventListener(event, listener);
  } catch {
    return {
      remove() {
        // no-op
      },
    };
  }
}

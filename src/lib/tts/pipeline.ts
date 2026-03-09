import { initializeAudioSession } from './audioSession';
import { chunkText } from './chunker';
import { createCacheKey, getCachedAudioForKey, reserveCachePath } from './cache';
import { DEFAULT_CHUNK_SIZE } from './constants';
import { TtsError } from './errors';
import { synthesizeToFileNative } from './native-synthesis';
import { getNativeSynthesisSpeedFromUiRate } from './playback-rate';
import { PlaybackQueue, QueueStateSnapshot } from './queue';
import { PipelineChunkResult, PipelineOptions, PipelineResult } from './types';

export async function preparePipeline(text: string, options: PipelineOptions): Promise<PipelineResult> {
  if (!text.trim()) {
    throw new TtsError('INVALID_INPUT', 'Cannot synthesize empty text.');
  }

  const chunks = chunkText(text, { maxChunkChars: options.chunkSize ?? DEFAULT_CHUNK_SIZE });
  const results = [] as PipelineResult['chunks'];

  for (const chunk of chunks) {
    const speed = getNativeSynthesisSpeedFromUiRate(options.rate);
    const cacheKey = await createCacheKey({
      modelId: options.modelId,
      text: chunk.text,
      language: options.language,
      speed,
    });

    const cached = await getCachedAudioForKey(cacheKey);
    if (cached) {
      results.push({ chunk, cacheKey, audioPath: cached, usedFallback: false });
      continue;
    }

    try {
      const outputPath = await reserveCachePath(cacheKey);
      const filePath = await synthesizeToFileNative(chunk.text, {
        modelId: options.modelId,
        outputPath,
        language: options.language,
        speed,
      });
      results.push({ chunk, cacheKey, audioPath: filePath, usedFallback: false });
    } catch (error) {
      results.push({
        chunk,
        cacheKey,
        usedFallback: Boolean(options.fallbackToSystemTts),
        errorMessage: error instanceof Error ? error.message : 'Unknown synthesis error',
      });
    }
  }

  return {
    modelId: options.modelId,
    chunks: results,
  };
}

export async function playPipeline(
  pipeline: PipelineResult,
  options: PipelineOptions,
  onProgress?: (done: number, total: number) => void
): Promise<void> {
  const controller = createPipelinePlaybackController();
  try {
    await controller.play(pipeline, options, onProgress);
  } finally {
    controller.dispose();
  }
}

async function resolveChunkAudioPath(
  chunk: PipelineChunkResult['chunk'],
  options: PipelineOptions
): Promise<PipelineChunkResult> {
  const speed = getNativeSynthesisSpeedFromUiRate(options.rate);
  const cacheKey = await createCacheKey({
    modelId: options.modelId,
    text: chunk.text,
    language: options.language,
    speed,
  });

  const cached = await getCachedAudioForKey(cacheKey);
  if (cached) {
    return { chunk, cacheKey, audioPath: cached, usedFallback: false };
  }

  try {
    const outputPath = await reserveCachePath(cacheKey);
    const filePath = await synthesizeToFileNative(chunk.text, {
      modelId: options.modelId,
      outputPath,
      language: options.language,
      speed,
    });

    return { chunk, cacheKey, audioPath: filePath, usedFallback: false };
  } catch (error) {
    return {
      chunk,
      cacheKey,
      usedFallback: Boolean(options.fallbackToSystemTts),
      errorMessage: error instanceof Error ? error.message : 'Unknown synthesis error',
    };
  }
}

export type StreamingPipelineCallbacks = {
  onPipelineReady?: (pipeline: PipelineResult) => void;
  onChunkResolved?: (index: number, total: number, item: PipelineChunkResult) => void;
  onChunkStart?: (index: number, total: number, item: PipelineChunkResult) => void;
  onProgress?: (done: number, total: number) => void;
};

export async function playStreamingPipeline(
  text: string,
  options: PipelineOptions,
  callbacks: StreamingPipelineCallbacks = {},
  controller?: PipelinePlaybackController
): Promise<PipelineResult> {
  if (!text.trim()) {
    throw new TtsError('INVALID_INPUT', 'Cannot synthesize empty text.');
  }

  const chunks = chunkText(text, { maxChunkChars: options.chunkSize ?? DEFAULT_CHUNK_SIZE });
  if (chunks.length === 0) {
    throw new TtsError('INVALID_INPUT', 'Pipeline has no chunks to play.');
  }

  const pipeline: PipelineResult = {
    modelId: options.modelId,
    chunks: chunks.map((chunk, index) => ({
      chunk,
      cacheKey: `pending-${index}`,
      usedFallback: Boolean(options.fallbackToSystemTts),
    })),
  };

  callbacks.onPipelineReady?.(pipeline);

  const pendingResolutions = new Map<number, Promise<PipelineChunkResult>>();

  const resolveChunk = (index: number): Promise<PipelineChunkResult> => {
    const existing = pendingResolutions.get(index);
    if (existing) {
      return existing;
    }

    const promise = resolveChunkAudioPath(pipeline.chunks[index].chunk, options)
      .then((resolved) => {
        pipeline.chunks[index] = resolved;
        callbacks.onChunkResolved?.(index, pipeline.chunks.length, resolved);
        return resolved;
      })
      .finally(() => {
        pendingResolutions.delete(index);
      });

    pendingResolutions.set(index, promise);
    return promise;
  };

  await resolveChunk(0);
  if (pipeline.chunks.length > 1) {
    void resolveChunk(1).catch(() => undefined);
  }

  const activeController = controller ?? createPipelinePlaybackController();

  try {
    await activeController.play(pipeline, options, callbacks.onProgress, {
      onChunkStart(index, total, item) {
        callbacks.onChunkStart?.(index, total, item);
        const nextIndex = index + 1;
        if (nextIndex < pipeline.chunks.length) {
          void resolveChunk(nextIndex).catch(() => undefined);
        }
      },
      async resolveChunkAudio(index) {
        return resolveChunk(index);
      },
    });
  } finally {
    if (!controller) {
      activeController.dispose();
    }
  }

  return pipeline;
}

type PipelinePlayCallbacks = {
  onChunkStart?: (index: number, total: number, item: PipelineChunkResult) => void;
  resolveChunkAudio?: (
    index: number,
    total: number,
    item: PipelineChunkResult
  ) => Promise<PipelineChunkResult | null | undefined>;
};

export type PipelinePlaybackController = {
  play: (
    pipeline: PipelineResult,
    options: PipelineOptions,
    onProgress?: (done: number, total: number) => void,
    callbacks?: PipelinePlayCallbacks
  ) => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => Promise<void>;
  skipChunk: () => Promise<void>;
  rewindChunk: () => Promise<void>;
  setPlaybackRate: (rate: number) => void;
  getSnapshot: () => QueueStateSnapshot;
  dispose: () => void;
};

let sharedQueue: PlaybackQueue | null = null;

function getSharedQueue(): PlaybackQueue {
  if (!sharedQueue) {
    sharedQueue = new PlaybackQueue();
  }

  return sharedQueue;
}

export function createPipelinePlaybackController(): PipelinePlaybackController {
  const queue = getSharedQueue();

  return {
    async play(
      pipeline: PipelineResult,
      options: PipelineOptions,
      onProgress?: (done: number, total: number) => void,
      callbacks?: PipelinePlayCallbacks
    ) {
      if (!pipeline.chunks.length) {
        throw new TtsError('INVALID_INPUT', 'Pipeline has no chunks to play.');
      }

      await initializeAudioSession();
      await queue.playChunks(pipeline.chunks, options, {
        onProgress,
        onItemStart: callbacks?.onChunkStart,
        resolveChunkAudio: callbacks?.resolveChunkAudio,
      });
    },
    pause() {
      queue.pause();
    },
    resume() {
      queue.resume();
    },
    stop() {
      return queue.stop();
    },
    skipChunk() {
      return queue.skipCurrent();
    },
    rewindChunk() {
      return queue.rewindCurrent();
    },
    setPlaybackRate(rate: number) {
      queue.setPlaybackRate(rate);
    },
    getSnapshot() {
      return queue.getSnapshot();
    },
    dispose() {
      // Shared singleton transport should stay alive across screen transitions.
    },
  };
}

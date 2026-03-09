import { useReaderSessionStore } from '@/features/tts/reader-session-store';

import { APP_NAME } from './constants';
import { TtsError, asTtsError } from './errors';
import { speakWithSystemTts, stopSystemTts } from './fallback';
import {
  addChunkTrack,
  addTrackPlayerListener,
  ensureTrackPlayerSetup,
  loadChunkTrack,
  pauseTrackPlayer,
  playTrackPlayer,
  setTrackPlayerRate,
  TrackPlayerEvent,
  stopTrackPlayer,
} from './trackPlayer';
import { normalizePlaybackRate } from './playback-rate';
import { PipelineChunkResult, PipelineOptions } from './types';

type PlaybackCallbacks = {
  onItemStart?: (index: number, total: number, item: PipelineChunkResult) => void;
  onItemComplete?: (index: number, total: number, item: PipelineChunkResult) => void;
  onProgress?: (done: number, total: number) => void;
  resolveChunkAudio?: (
    index: number,
    total: number,
    item: PipelineChunkResult
  ) => Promise<PipelineChunkResult | null | undefined>;
};

export type QueueStateSnapshot = {
  running: boolean;
  paused: boolean;
  currentIndex: number;
  completed: number;
  total: number;
};

export class PlaybackQueue {
  private readonly queueEndedSubscription = addTrackPlayerListener(
    TrackPlayerEvent.PlaybackQueueEnded,
    () => {
      void this.onQueueEnded();
    }
  );

  /**
   * Gapless playback: when ExoPlayer/AVQueuePlayer transitions to the next
   * track we complete the previous chunk and pre-queue the one after next.
   * This keeps the underlying AudioTrack alive across chunk boundaries so
   * there is no hardware-level click/pop between chunks.
   */
  private readonly activeTrackChangedSubscription = addTrackPlayerListener(
    TrackPlayerEvent.PlaybackActiveTrackChanged,
    (payload?: any) => {
      void this.onActiveTrackChanged(payload);
    }
  );

  private chunks: PipelineChunkResult[] = [];
  private options: PipelineOptions | null = null;
  private callbacks: PlaybackCallbacks = {};
  private currentIndex = -1;
  /**
   * Highest chunk index that has been committed to the RNTP queue via
   * load() or add().  Used to prevent double-queueing the same chunk.
   */
  private queuedUpTo = -1;
  private completedCount = 0;
  private stopped = true;
  private paused = false;
  private advancing = false;
  private speakingFallback = false;
  private runResolver: (() => void) | null = null;
  private runRejecter: ((error: Error) => void) | null = null;
  /** UI rate at which audio was synthesized; used to compute relative track player rate adjustments. */
  private synthesisUiRate = 1;

  getSnapshot(): QueueStateSnapshot {
    return {
      running: !this.stopped,
      paused: this.paused,
      currentIndex: this.currentIndex,
      completed: this.completedCount,
      total: this.chunks.length,
    };
  }

  async playChunks(
    chunks: PipelineChunkResult[],
    options: PipelineOptions,
    callbacks: PlaybackCallbacks = {}
  ): Promise<void> {
    if (chunks.length === 0) {
      return;
    }

    await this.stop();
    await ensureTrackPlayerSetup();

    this.chunks = [...chunks];
    this.options = options;
    this.synthesisUiRate = normalizePlaybackRate(options.rate ?? 1);
    this.callbacks = callbacks;
    this.currentIndex = -1;
    this.queuedUpTo = -1;
    this.completedCount = 0;
    this.stopped = false;
    this.paused = false;
    this.advancing = false;
    this.speakingFallback = false;

    useReaderSessionStore.getState().setPlaybackState({
      isPlaying: false,
      isPaused: false,
      errorMessage: undefined,
      total: chunks.length,
      progress: 0,
      currentChunkIndex: -1,
      activeChunk: null,
    });

    const runPromise = new Promise<void>((resolve, reject) => {
      this.runResolver = resolve;
      this.runRejecter = reject;
    });

    await this.advanceToNextChunk();
    return runPromise;
  }

  pause(): void {
    if (this.stopped || this.paused) {
      return;
    }

    this.paused = true;
    void stopSystemTts().catch(() => undefined);
    void pauseTrackPlayer().catch(() => undefined);
    useReaderSessionStore.getState().setPlaybackState({ isPlaying: false, isPaused: true });
  }

  resume(): void {
    if (this.stopped || !this.paused || this.speakingFallback) {
      return;
    }

    this.paused = false;
    void playTrackPlayer().catch(() => undefined);
    void this.applyPlaybackRate();
    useReaderSessionStore.getState().setPlaybackState({ isPlaying: true, isPaused: false });
  }

  setPlaybackRate(rate: number): void {
    const normalizedRate = normalizePlaybackRate(rate);
    this.options = this.options ? { ...this.options, rate: normalizedRate } : { modelId: '', rate: normalizedRate };
    void this.applyPlaybackRate(normalizedRate);
  }

  async skipCurrent(): Promise<void> {
    if (this.stopped) {
      return;
    }

    if (this.speakingFallback) {
      await stopSystemTts().catch(() => undefined);
      this.speakingFallback = false;
    } else {
      await stopTrackPlayer().catch(() => undefined);
    }

    this.queuedUpTo = -1;
    this.completeCurrentChunk();
    await this.advanceToNextChunk();
  }

  async rewindCurrent(): Promise<void> {
    if (this.stopped) {
      return;
    }

    if (this.speakingFallback) {
      await stopSystemTts().catch(() => undefined);
      this.speakingFallback = false;
    } else {
      await stopTrackPlayer().catch(() => undefined);
    }

    this.queuedUpTo = -1;
    this.currentIndex = Math.max(-1, this.currentIndex - 2);
    this.completedCount = Math.max(0, this.currentIndex + 1);
    useReaderSessionStore.getState().setPlaybackState({
      progress: this.completedCount,
      currentChunkIndex: this.currentIndex,
    });

    await this.advanceToNextChunk();
  }

  async stop(): Promise<void> {
    const hasWork = !this.stopped || this.currentIndex >= 0 || this.chunks.length > 0;

    this.stopped = true;
    this.paused = false;
    this.advancing = false;
    this.speakingFallback = false;

    await Promise.allSettled([stopSystemTts(), stopTrackPlayer()]);

    this.chunks = [];
    this.options = null;
    this.currentIndex = -1;
    this.queuedUpTo = -1;
    this.completedCount = 0;
    this.callbacks = {};

    useReaderSessionStore.getState().setPlaybackState({
      isPlaying: false,
      isPaused: false,
      isPreparing: false,
      progress: 0,
      total: 0,
      currentChunkIndex: -1,
      activeChunk: null,
      pipeline: null,
      sourceText: '',
    });

    if (hasWork) {
      this.resolveRun();
    }
  }

  dispose(): void {
    this.queueEndedSubscription.remove();
    this.activeTrackChangedSubscription.remove();
    void this.stop();
  }

  /**
   * Fired when the entire RNTP queue has been consumed.  With gapless
   * pre-queuing this only fires after the last chunk finishes.  If a chunk
   * was not pre-queued in time (synthesis was slow) the queue empties early
   * and we fall back to load() for the remaining chunks.
   */
  private async onQueueEnded(): Promise<void> {
    if (this.stopped || this.paused || this.advancing || this.speakingFallback) {
      return;
    }

    this.completeCurrentChunk();
    await this.advanceToNextChunk();
  }

  /**
   * Fired by RNTP when the player transitions to a new track in the queue.
   * This is the happy-path for gapless playback: we update the current chunk,
   * fire callbacks, and schedule the NEXT chunk for pre-queuing.
   */
  private async onActiveTrackChanged(payload?: any): Promise<void> {
    if (this.stopped || this.paused || this.speakingFallback) {
      return;
    }

    const newTrackIndex: number | undefined = typeof payload?.index === 'number' ? payload.index : undefined;
    // `newTrackIndex` is RNTP queue index, which equals our chunk index (1:1
    // mapping because we load() the first chunk and add() all others in order).
    if (newTrackIndex === undefined || newTrackIndex <= this.currentIndex) {
      return;
    }

    // Complete the chunk that just finished.
    this.completeCurrentChunk();

    // Move to the new chunk.
    this.currentIndex = newTrackIndex;
    const item = this.chunks[this.currentIndex];
    if (!item) {
      return;
    }

    this.callbacks.onItemStart?.(this.currentIndex, this.chunks.length, item);
    useReaderSessionStore.getState().setPlaybackState({
      isPreparing: false,
      isPlaying: true,
      isPaused: false,
      currentChunkIndex: this.currentIndex,
      activeChunk: item.chunk,
      total: this.chunks.length,
      progress: this.currentIndex,
      errorMessage: undefined,
    });

    // Pre-queue the chunk after this one so ExoPlayer can transition gaplessly.
    void this.preQueueChunkIfPossible().catch(() => undefined);
  }

  /**
   * Resolves chunks[queuedUpTo + 1] and appends it to RNTP's queue via add().
   * Reserving `queuedUpTo` before the async resolve prevents concurrent calls
   * from double-queuing the same chunk.
   */
  private async preQueueChunkIfPossible(): Promise<void> {
    const nextIndex = this.queuedUpTo + 1;
    if (nextIndex >= this.chunks.length || this.stopped) {
      return;
    }

    // Reserve this slot immediately to prevent double-queuing.
    this.queuedUpTo = nextIndex;

    let item = this.chunks[nextIndex];

    // Resolve the audio path if not yet done.
    if (!item.audioPath && this.callbacks.resolveChunkAudio) {
      const resolved = await this.callbacks.resolveChunkAudio(nextIndex, this.chunks.length, item).catch(
        () => undefined
      );
      if (resolved) {
        this.chunks[nextIndex] = resolved;
        item = resolved;
      }
    }

    if (!item.audioPath || this.stopped) {
      // Could not resolve; PlaybackQueueEnded will fire and the fallback
      // advanceToNextChunk() path will handle this chunk via load().
      return;
    }

    await addChunkTrack(item, {
      title: useReaderSessionStore.getState().title || APP_NAME,
      artist: this.options?.modelId || APP_NAME,
    });
  }

  private async advanceToNextChunk(): Promise<void> {
    if (this.stopped || this.advancing) {
      return;
    }

    this.advancing = true;

    try {
      while (!this.stopped) {
        const nextIndex = this.currentIndex + 1;
        if (nextIndex >= this.chunks.length) {
          await this.finishRun();
          return;
        }

        this.currentIndex = nextIndex;
        const item = this.chunks[this.currentIndex];
        this.callbacks.onItemStart?.(this.currentIndex, this.chunks.length, item);

        useReaderSessionStore.getState().setPlaybackState({
          isPreparing: false,
          isPlaying: true,
          isPaused: false,
          currentChunkIndex: this.currentIndex,
          activeChunk: item.chunk,
          total: this.chunks.length,
          progress: this.currentIndex,
          errorMessage: undefined,
        });

        if (item.audioPath) {
          await loadChunkTrack(
            item,
            {
              title: useReaderSessionStore.getState().title || APP_NAME,
              artist: this.options?.modelId || APP_NAME,
            },
            this.options?.rate
          );
          this.queuedUpTo = this.currentIndex;
          // Apply rate before play so the first frame is at the correct speed.
          await this.applyPlaybackRate();
          await playTrackPlayer();
          // Pre-queue next chunk for gapless transition (fire-and-forget).
          void this.preQueueChunkIfPossible().catch(() => undefined);
          return;
        }

        if (this.callbacks.resolveChunkAudio) {
          const resolved =
            (await this.callbacks.resolveChunkAudio(this.currentIndex, this.chunks.length, item)) ??
            this.chunks[this.currentIndex];

          this.chunks[this.currentIndex] = resolved;
          if (resolved.audioPath) {
            await loadChunkTrack(
              resolved,
              {
                title: useReaderSessionStore.getState().title || APP_NAME,
                artist: this.options?.modelId || APP_NAME,
              },
              this.options?.rate
            );
            this.queuedUpTo = this.currentIndex;
            // Apply rate before play so the first frame is at the correct speed.
            await this.applyPlaybackRate();
            await playTrackPlayer();
            // Pre-queue next chunk for gapless transition (fire-and-forget).
            void this.preQueueChunkIfPossible().catch(() => undefined);
            return;
          }
        }

        const unresolvedItem = this.chunks[this.currentIndex];

        if (!this.options?.fallbackToSystemTts) {
          throw new TtsError(
            'NATIVE_FAILURE',
            unresolvedItem.errorMessage ?? 'Chunk synthesis failed and fallback is disabled.'
          );
        }

        this.speakingFallback = true;
        try {
          await speakWithSystemTts(item.chunk.text, {
            language: this.options.language,
            rate: this.options.rate,
            pitch: this.options.pitch,
            fallbackToSystemTts: true,
          });
        } finally {
          this.speakingFallback = false;
        }

        if (this.stopped) {
          return;
        }

        this.completeCurrentChunk();
      }
    } catch (error) {
      const playbackError = asTtsError(error, 'PLAYBACK_FAILED', 'Failed to advance TTS playback queue.');
      useReaderSessionStore.getState().setPlaybackState({
        isPlaying: false,
        isPaused: false,
        isPreparing: false,
        activeChunk: null,
        errorMessage: playbackError.message,
      });
      this.rejectRun(playbackError);
    } finally {
      this.advancing = false;
    }
  }

  private completeCurrentChunk(): void {
    if (this.currentIndex < 0 || this.currentIndex >= this.chunks.length) {
      return;
    }

    const item = this.chunks[this.currentIndex];
    this.completedCount += 1;
    this.callbacks.onItemComplete?.(this.currentIndex, this.chunks.length, item);
    this.callbacks.onProgress?.(this.completedCount, this.chunks.length);
    useReaderSessionStore.getState().setPlaybackState({
      progress: this.completedCount,
    });
  }

  private async finishRun(): Promise<void> {
    this.stopped = true;
    this.paused = false;
    await stopTrackPlayer().catch(() => undefined);
    useReaderSessionStore.getState().setPlaybackState({
      isPlaying: false,
      isPaused: false,
      isPreparing: false,
      activeChunk: null,
      progress: this.chunks.length,
      total: this.chunks.length,
      currentChunkIndex: this.chunks.length - 1,
    });
    this.resolveRun();
  }

  private async applyPlaybackRate(rate = this.options?.rate): Promise<void> {
    const targetRate = normalizePlaybackRate(rate ?? 1);
    // Compute relative rate so the track player compensates for the already-synthesized audio speed.
    // e.g. audio synthesized at 1.0x, user wants 1.25x → track player rate = 1.25
    const relativeRate = normalizePlaybackRate(targetRate / this.synthesisUiRate);
    await setTrackPlayerRate(relativeRate).catch(() => undefined);
  }

  private resolveRun(): void {
    this.runResolver?.();
    this.runResolver = null;
    this.runRejecter = null;
  }

  private rejectRun(error: Error): void {
    this.stopped = true;
    this.paused = false;
    this.runRejecter?.(error);
    this.runResolver = null;
    this.runRejecter = null;
  }
}

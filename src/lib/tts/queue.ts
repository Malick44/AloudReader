import type { AudioPlayer, AudioStatus } from 'expo-audio';

import { APP_NAME } from './constants';
import { TtsError, asTtsError } from './errors';
import { speakWithSystemTts, stopSystemTts } from './fallback';
import { PipelineChunkResult, PipelineOptions } from './types';

const PLAYBACK_STATUS_EVENT = 'playbackStatusUpdate';

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
  private readonly player: AudioPlayer;
  private readonly subscription: { remove: () => void };

  private chunks: PipelineChunkResult[] = [];
  private options: PipelineOptions | null = null;
  private callbacks: PlaybackCallbacks = {};
  private currentIndex = -1;
  private completedCount = 0;
  private stopped = true;
  private paused = false;
  private advancing = false;
  private speakingFallback = false;
  private runResolver: (() => void) | null = null;
  private runRejecter: ((error: Error) => void) | null = null;

  constructor(player: AudioPlayer) {
    this.player = player;
    this.subscription = this.player.addListener(PLAYBACK_STATUS_EVENT, (status: AudioStatus) => {
      void this.onStatusUpdate(status);
    });
  }

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

    this.chunks = [...chunks];
    this.options = options;
    this.callbacks = callbacks;
    this.currentIndex = -1;
    this.completedCount = 0;
    this.stopped = false;
    this.paused = false;
    this.advancing = false;
    this.speakingFallback = false;

    this.activateLockScreen();

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
    this.player.pause();
  }

  resume(): void {
    if (this.stopped || !this.paused || this.speakingFallback) {
      return;
    }
    this.paused = false;
    this.player.play();
  }

  async skipCurrent(): Promise<void> {
    if (this.stopped) {
      return;
    }

    if (this.speakingFallback) {
      await stopSystemTts().catch(() => undefined);
      this.speakingFallback = false;
    } else {
      this.player.pause();
    }

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
      this.player.pause();
    }

    // Go back by 2 so advanceToNextChunk brings us to current - 1
    this.currentIndex = Math.max(-1, this.currentIndex - 2);
    this.completedCount = Math.max(0, this.currentIndex + 1);
    
    await this.advanceToNextChunk();
  }

  async stop(): Promise<void> {
    const hasWork = !this.stopped || this.currentIndex >= 0 || this.chunks.length > 0;
    this.stopped = true;
    this.paused = false;
    this.advancing = false;
    this.speakingFallback = false;

    await stopSystemTts().catch(() => undefined);
    this.clearLockScreen();
    this.releasePlayer();

    this.chunks = [];
    this.options = null;
    this.currentIndex = -1;
    this.completedCount = 0;
    this.callbacks = {};

    if (hasWork) {
      this.resolveRun();
    }
  }

  dispose(): void {
    this.subscription.remove();
    void this.stop();
  }

  private async onStatusUpdate(status: AudioStatus): Promise<void> {
    if (
      this.stopped ||
      this.paused ||
      this.advancing ||
      this.speakingFallback ||
      !status.didJustFinish
    ) {
      return;
    }
    this.completeCurrentChunk();
    await this.advanceToNextChunk();
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

        if (item.audioPath) {
          this.player.replace({ uri: item.audioPath });
          this.player.play();
          return;
        }

        if (this.callbacks.resolveChunkAudio) {
          const resolved =
            (await this.callbacks.resolveChunkAudio(this.currentIndex, this.chunks.length, item)) ??
            this.chunks[this.currentIndex];

          this.chunks[this.currentIndex] = resolved;
          if (resolved.audioPath) {
            this.player.replace({ uri: resolved.audioPath });
            this.player.play();
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
      this.rejectRun(
        asTtsError(error, 'PLAYBACK_FAILED', 'Failed to advance TTS playback queue.')
      );
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
  }

  private async finishRun(): Promise<void> {
    this.stopped = true;
    this.paused = false;
    this.clearLockScreen();
    this.releasePlayer();
    this.resolveRun();
  }

  private activateLockScreen(): void {
    try {
      this.player.setActiveForLockScreen(
        true,
        {
          title: APP_NAME,
          artist: this.options?.modelId,
        },
        {
          showSeekBackward: true,
          showSeekForward: true,
        }
      );
    } catch {
      // Best-effort: lock-screen controls vary by platform/runtime.
    }
  }

  private clearLockScreen(): void {
    try {
      this.player.clearLockScreenControls();
    } catch {
      // Best-effort cleanup.
    }
  }

  private releasePlayer(): void {
    try {
      this.player.pause();
    } catch {
      // Best effort: useAudioPlayer owns the player lifecycle and may release it before we pause.
    }
  }

  private resolveRun(): void {
    this.runResolver?.();
    this.runResolver = null;
    this.runRejecter = null;
  }

  private rejectRun(error: Error): void {
    this.stopped = true;
    this.paused = false;
    this.clearLockScreen();
    this.releasePlayer();
    this.runRejecter?.(error);
    this.runResolver = null;
    this.runRejecter = null;
  }
}

import { useEffect, useMemo, useState } from 'react';

import i18n from '@/i18n';
import {
  PipelineChunkResult,
  PipelineOptions,
  PipelineResult,
  createPipelinePlaybackController,
  getTrackPlayerPlaybackState,
  getTrackPlayerProgress,
  normalizePlaybackRate,
  TrackPlayerState,
  playStreamingPipeline,
  preparePipeline,
} from '@/lib/tts';

import { useReaderSessionStore } from './reader-session-store';

export function useLocalTtsReader(playbackRate = 1) {
  const playbackController = useMemo(() => createPipelinePlaybackController(), []);
  const [trackPlayerState, setTrackPlayerState] = useState<string>(TrackPlayerState.None);
  const [progressState, setProgressState] = useState({ position: 0, duration: 0, buffered: 0 });

  const {
    isPreparing,
    isPaused,
    progress,
    total,
    currentChunkIndex,
    activeChunk,
    sourceText,
    pipeline,
    chunkDurations,
    errorMessage,
    setPlaybackState,
    setChunkDuration,
  } = useReaderSessionStore();

  useEffect(() => {
    let cancelled = false;

    const sync = async () => {
      const [playback, progress] = await Promise.all([
        getTrackPlayerPlaybackState(),
        getTrackPlayerProgress(),
      ]);

      if (cancelled) {
        return;
      }

      setTrackPlayerState(playback.state);
      setProgressState(progress);
    };

    void sync();
    const intervalId = setInterval(() => {
      void sync();
    }, 250);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  const isPlaying = trackPlayerState === TrackPlayerState.Playing || trackPlayerState === TrackPlayerState.Buffering;
  const playerStatus = {
    currentTime: progressState.position,
    duration: progressState.duration,
    playing: isPlaying,
    buffering: trackPlayerState === TrackPlayerState.Buffering,
    state: trackPlayerState,
  };

  useEffect(() => {
    playbackController.setPlaybackRate(normalizePlaybackRate(playbackRate));
  }, [playbackController, playbackRate]);

  useEffect(() => {
    setPlaybackState({
      isPlaying,
      isPaused: trackPlayerState === TrackPlayerState.Paused ? true : isPaused && !isPlaying,
    });
  }, [isPaused, isPlaying, setPlaybackState, trackPlayerState]);

  useEffect(() => {
    if (activeChunk && progressState.duration > 0) {
      setChunkDuration(activeChunk.id, progressState.duration);
    }
  }, [activeChunk, progressState.duration, setChunkDuration]);

  const playbackTimeline = useMemo(() => {
    const chunks = pipeline?.chunks ?? [];
    const activeChunkId = activeChunk?.id ?? null;

    let knownDurationTotal = 0;
    let knownCharTotal = 0;

    for (const item of chunks) {
      const knownDuration = item.chunk.id === activeChunkId && progressState.duration > 0
        ? progressState.duration
        : chunkDurations[item.chunk.id];

      if (knownDuration && Number.isFinite(knownDuration) && knownDuration > 0) {
        knownDurationTotal += knownDuration;
        knownCharTotal += Math.max(item.chunk.text.length, 1);
      }
    }

    const secondsPerChar = knownCharTotal > 0 ? knownDurationTotal / knownCharTotal : 0;

    const resolveChunkDuration = (item: PipelineChunkResult) => {
      const actualDuration = item.chunk.id === activeChunkId && progressState.duration > 0
        ? progressState.duration
        : chunkDurations[item.chunk.id];

      if (actualDuration && Number.isFinite(actualDuration) && actualDuration > 0) {
        return actualDuration;
      }

      if (secondsPerChar > 0) {
        return item.chunk.text.length * secondsPerChar;
      }

      return 0;
    };

    const completedCount = Math.min(progress, chunks.length);
    const completedSeconds = chunks
      .slice(0, completedCount)
      .reduce((sum, item) => sum + resolveChunkDuration(item), 0);
    const totalSeconds = chunks.reduce((sum, item) => sum + resolveChunkDuration(item), 0);
    const liveSeconds = isPlaying || isPaused ? Math.max(0, progressState.position) : 0;
    const elapsedSeconds = totalSeconds > 0
      ? Math.min(completedSeconds + liveSeconds, totalSeconds)
      : completedSeconds + liveSeconds;

    return {
      elapsedSeconds,
      totalSeconds: totalSeconds > 0 ? totalSeconds : null,
      remainingSeconds: totalSeconds > 0 ? Math.max(totalSeconds - elapsedSeconds, 0) : null,
      progressPct: totalSeconds > 0
        ? Math.round((elapsedSeconds / totalSeconds) * 100)
        : total
          ? Math.round((progress / total) * 100)
          : 0,
    };
  }, [activeChunk, chunkDurations, isPaused, isPlaying, pipeline, progress, progressState.duration, progressState.position, total]);

  const prepare = async (text: string, options: PipelineOptions) => {
    setPlaybackState({
      isPreparing: true,
      errorMessage: undefined,
      progress: 0,
      total: 0,
      currentChunkIndex: -1,
      isPaused: false,
      activeChunk: null,
      sourceText: text,
      pipeline: null,
      chunkDurations: {},
    });

    try {
      const nextPipeline = await preparePipeline(text, options);
      setPlaybackState({
        isPreparing: false,
        pipeline: nextPipeline,
        total: nextPipeline.chunks.length,
        progress: 0,
        currentChunkIndex: -1,
        isPaused: false,
        activeChunk: null,
        sourceText: text,
      });
      return nextPipeline;
    } catch (error) {
      setPlaybackState({
        isPreparing: false,
        errorMessage: error instanceof Error ? error.message : i18n.t('errors.prepare_failed_generic'),
      });
      return null;
    }
  };

  const stream = async (text: string, options: PipelineOptions) => {
    setPlaybackState({
      isPreparing: true,
      isPlaying: false,
      isPaused: false,
      errorMessage: undefined,
      progress: 0,
      total: 0,
      currentChunkIndex: -1,
      pipeline: null,
      activeChunk: null,
      sourceText: text,
      chunkDurations: {},
    });

    try {
      const nextPipeline = await playStreamingPipeline(
        text,
        options,
        {
          onPipelineReady: (resolvedPipeline) => {
            setPlaybackState({
              pipeline: resolvedPipeline,
              total: resolvedPipeline.chunks.length,
              progress: 0,
              currentChunkIndex: -1,
            });
          },
          onChunkStart: (index, chunkTotal, item) => {
            setPlaybackState({
              isPreparing: false,
              isPlaying: true,
              isPaused: false,
              progress: index,
              total: chunkTotal,
              currentChunkIndex: index,
              activeChunk: item.chunk,
              errorMessage: undefined,
            });
          },
          onProgress: (done, chunkTotal) => {
            setPlaybackState({ progress: done, total: chunkTotal });
          },
        },
        playbackController
      );

      setPlaybackState({
        isPreparing: false,
        isPlaying: false,
        isPaused: false,
        currentChunkIndex: nextPipeline.chunks.length - 1,
        pipeline: nextPipeline,
        activeChunk: null,
      });
    } catch (error) {
      setPlaybackState({
        isPreparing: false,
        isPlaying: false,
        isPaused: false,
        currentChunkIndex: -1,
        activeChunk: null,
        errorMessage: error instanceof Error ? error.message : i18n.t('errors.playback_failed_generic'),
      });
    }
  };

  const play = async (options: PipelineOptions) => {
    const activePipeline = pipeline;
    if (!activePipeline) {
      return;
    }

    setPlaybackState({ isPlaying: true, isPaused: false, errorMessage: undefined });
    try {
      await playbackController.play(
        activePipeline,
        options,
        (done, chunkTotal) => {
          setPlaybackState({ progress: done, total: chunkTotal });
        },
        {
          onChunkStart: (index, chunkTotal, item) => {
            setPlaybackState({
              progress: index,
              total: chunkTotal,
              currentChunkIndex: index,
              activeChunk: item.chunk,
            });
          },
        }
      );

      setPlaybackState({
        isPlaying: false,
        isPaused: false,
        currentChunkIndex: activePipeline.chunks.length ? activePipeline.chunks.length - 1 : currentChunkIndex,
        activeChunk: null,
      });
    } catch (error) {
      setPlaybackState({
        isPlaying: false,
        isPaused: false,
        currentChunkIndex: -1,
        activeChunk: null,
        errorMessage: error instanceof Error ? error.message : i18n.t('errors.playback_failed_generic'),
      });
    }
  };

  const pause = () => {
    playbackController.pause();
    setPlaybackState({ isPlaying: false, isPaused: true });
  };

  const resume = () => {
    playbackController.resume();
    setPlaybackState({ isPlaying: true, isPaused: false });
  };

  const stop = async () => {
    try {
      await playbackController.stop();
      setPlaybackState({
        isPlaying: false,
        isPaused: false,
        currentChunkIndex: -1,
        activeChunk: null,
      });
    } catch (error) {
      setPlaybackState({
        isPlaying: false,
        isPaused: false,
        currentChunkIndex: -1,
        activeChunk: null,
        errorMessage: error instanceof Error ? error.message : i18n.t('errors.playback_failed_generic'),
      });
    }
  };

  const skipChunk = async () => {
    try {
      await playbackController.skipChunk();
    } catch (error) {
      setPlaybackState({
        errorMessage: error instanceof Error ? error.message : i18n.t('errors.playback_failed_generic'),
      });
    }
  };

  const rewindChunk = async () => {
    try {
      await playbackController.rewindChunk();
    } catch (error) {
      setPlaybackState({
        errorMessage: error instanceof Error ? error.message : i18n.t('errors.playback_failed_generic'),
      });
    }
  };

  const setPlaybackRate = (rate: number) => {
    playbackController.setPlaybackRate(normalizePlaybackRate(rate));
  };

  return {
    isPreparing,
    isPlaying,
    isPaused,
    progress,
    total,
    currentChunkIndex,
    activeChunk,
    sourceText,
    pipeline,
    chunkDurations,
    errorMessage,
    progressPct: playbackTimeline.progressPct,
    elapsedSeconds: playbackTimeline.elapsedSeconds,
    totalDurationSeconds: playbackTimeline.totalSeconds,
    remainingSeconds: playbackTimeline.remainingSeconds,
    playerStatus,
    prepare,
    stream,
    play,
    pause,
    resume,
    stop,
    skipChunk,
    rewindChunk,
    setPlaybackRate,
  };
}

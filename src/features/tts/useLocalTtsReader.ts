import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect, useMemo, useState } from 'react';

import i18n from '@/i18n';
import {
  ChunkMetadata,
  PipelineOptions,
  PipelineResult,
  createPipelinePlaybackController,
  playStreamingPipeline,
  preparePipeline,
} from '@/lib/tts';

type ReaderState = {
  isPreparing: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  progress: number;
  total: number;
  activeChunk: ChunkMetadata | null;
  sourceText: string;
  pipeline: PipelineResult | null;
  errorMessage?: string;
};

const initialState: ReaderState = {
  isPreparing: false,
  isPlaying: false,
  isPaused: false,
  progress: 0,
  total: 0,
  activeChunk: null,
  sourceText: '',
  pipeline: null,
};

export function useLocalTtsReader() {
  const [state, setState] = useState<ReaderState>(initialState);
  const player = useAudioPlayer(null, {
    updateInterval: 100,
    keepAudioSessionActive: true,
  });
  const playerStatus = useAudioPlayerStatus(player);
  const playbackController = useMemo(() => createPipelinePlaybackController(player), [player]);

  useEffect(() => {
    return () => {
      playbackController.dispose();
    };
  }, [playbackController]);

  const progressPct = useMemo(() => {
    if (!state.total) {
      return 0;
    }
    return Math.round((state.progress / state.total) * 100);
  }, [state.progress, state.total]);

  const prepare = async (text: string, options: PipelineOptions) => {
    setState((prev) => ({
      ...prev,
      isPreparing: true,
      errorMessage: undefined,
      progress: 0,
      isPaused: false,
      activeChunk: null,
      sourceText: text,
    }));
    try {
      const pipeline = await preparePipeline(text, options);
      setState((prev) => ({
        ...prev,
        isPreparing: false,
        pipeline,
        total: pipeline.chunks.length,
        progress: 0,
        isPaused: false,
        activeChunk: null,
      }));
      return pipeline;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isPreparing: false,
        errorMessage:
          error instanceof Error ? error.message : i18n.t('errors.prepare_failed_generic'),
      }));
      return null;
    }
  };

  const stream = async (text: string, options: PipelineOptions) => {
    setState((prev) => ({
      ...prev,
      isPreparing: true,
      isPlaying: false,
      isPaused: false,
      errorMessage: undefined,
      progress: 0,
      total: 0,
      pipeline: null,
      activeChunk: null,
      sourceText: text,
    }));

    try {
      const pipeline = await playStreamingPipeline(player, text, options, {
        onPipelineReady: (nextPipeline) => {
          setState((prev) => ({
            ...prev,
            pipeline: nextPipeline,
            total: nextPipeline.chunks.length,
            progress: 0,
          }));
        },
        onChunkStart: (_index, _total, item) => {
          setState((prev) => ({
            ...prev,
            isPreparing: false,
            isPlaying: true,
            isPaused: false,
            activeChunk: item.chunk,
          }));
        },
        onProgress: (done, total) => {
          setState((prev) => ({ ...prev, progress: done, total }));
        },
      });

      setState((prev) => ({
        ...prev,
        isPreparing: false,
        isPlaying: false,
        isPaused: false,
        pipeline,
        activeChunk: null,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isPreparing: false,
        isPlaying: false,
        isPaused: false,
        activeChunk: null,
        errorMessage:
          error instanceof Error ? error.message : i18n.t('errors.playback_failed_generic'),
      }));
    }
  };

  const play = async (options: PipelineOptions) => {
    if (!state.pipeline) {
      return;
    }

    setState((prev) => ({ ...prev, isPlaying: true, isPaused: false, errorMessage: undefined }));
    try {
      await playbackController.play(
        state.pipeline,
        options,
        (done, total) => {
          setState((prev) => ({ ...prev, progress: done, total }));
        },
        {
          onChunkStart: (_index, _total, item) => {
            setState((prev) => ({ ...prev, activeChunk: item.chunk }));
          },
        }
      );
      setState((prev) => ({ ...prev, isPlaying: false, isPaused: false, activeChunk: null }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        isPaused: false,
        activeChunk: null,
        errorMessage:
          error instanceof Error ? error.message : i18n.t('errors.playback_failed_generic'),
      }));
    }
  };

  const pause = () => {
    playbackController.pause();
    setState((prev) => ({ ...prev, isPlaying: false, isPaused: true }));
  };

  const resume = () => {
    playbackController.resume();
    setState((prev) => ({ ...prev, isPlaying: true, isPaused: false }));
  };

  const stop = async () => {
    try {
      await playbackController.stop();
      setState((prev) => ({ ...prev, isPlaying: false, isPaused: false, activeChunk: null }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        isPaused: false,
        activeChunk: null,
        errorMessage:
          error instanceof Error ? error.message : i18n.t('errors.playback_failed_generic'),
      }));
    }
  };

  const skipChunk = async () => {
    try {
      await playbackController.skipChunk();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        errorMessage:
          error instanceof Error ? error.message : i18n.t('errors.playback_failed_generic'),
      }));
    }
  };

  const rewindChunk = async () => {
    try {
      await playbackController.rewindChunk();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        errorMessage:
          error instanceof Error ? error.message : i18n.t('errors.playback_failed_generic'),
      }));
    }
  };

  return {
    ...state,
    progressPct,
    playerStatus,
    prepare,
    stream,
    play,
    pause,
    resume,
    stop,
    skipChunk,
    rewindChunk,
  };
}

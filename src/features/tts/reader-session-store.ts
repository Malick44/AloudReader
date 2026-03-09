import { create } from 'zustand';

import type { ChunkMetadata, PipelineResult } from '@/lib/tts';

/**
 * Lightweight cross-screen store that tracks the currently active reader session.
 * The (reader)/[id] screen writes to this; MiniPlayerBar reads from it.
 */
type ReaderSessionState = {
  readerId: string | null;
  title: string;
  isPlaying: boolean;
  isPaused: boolean;
  isPreparing: boolean;
  progress: number; // 0–100
  total: number;
  currentChunkIndex: number;
  activeChunk: ChunkMetadata | null;
  sourceText: string;
  pipeline: PipelineResult | null;
  chunkDurations: Record<string, number>;
  errorMessage?: string;

  setSession: (readerId: string, title: string) => void;
  setPlaying: (isPlaying: boolean) => void;
  setPaused: (isPaused: boolean) => void;
  setProgress: (progress: number) => void;
  setPlaybackState: (patch: Partial<Omit<ReaderSessionState, 'setSession' | 'setPlaying' | 'setPaused' | 'setProgress' | 'setPlaybackState' | 'setChunkDuration' | 'clearSession'>>) => void;
  setChunkDuration: (chunkId: string, duration: number) => void;
  clearSession: () => void;
};

export const useReaderSessionStore = create<ReaderSessionState>((set) => ({
  readerId: null,
  title: '',
  isPlaying: false,
  isPaused: false,
  isPreparing: false,
  progress: 0,
  total: 0,
  currentChunkIndex: -1,
  activeChunk: null,
  sourceText: '',
  pipeline: null,
  chunkDurations: {},
  errorMessage: undefined,

  setSession: (readerId, title) => set({ readerId, title }),
  setPlaying: (isPlaying) => set({ isPlaying }),
  setPaused: (isPaused) => set({ isPaused }),
  setProgress: (progress) => set({ progress }),
  setPlaybackState: (patch) => set((state) => ({ ...state, ...patch })),
  setChunkDuration: (chunkId, duration) =>
    set((state) => ({
      chunkDurations: {
        ...state.chunkDurations,
        [chunkId]: duration,
      },
    })),
  clearSession: () =>
    set({
      readerId: null,
      title: '',
      isPlaying: false,
      isPaused: false,
      isPreparing: false,
      progress: 0,
      total: 0,
      currentChunkIndex: -1,
      activeChunk: null,
      sourceText: '',
      pipeline: null,
      chunkDurations: {},
      errorMessage: undefined,
    }),
}));

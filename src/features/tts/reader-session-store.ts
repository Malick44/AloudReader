import { create } from 'zustand';

/**
 * Lightweight cross-screen store that tracks the currently active reader session.
 * The (reader)/[id] screen writes to this; MiniPlayerBar reads from it.
 */
type ReaderSessionState = {
  readerId: string | null;
  title: string;
  isPlaying: boolean;
  progress: number; // 0–100

  setSession: (readerId: string, title: string) => void;
  setPlaying: (isPlaying: boolean) => void;
  setProgress: (progress: number) => void;
  clearSession: () => void;
};

export const useReaderSessionStore = create<ReaderSessionState>((set) => ({
  readerId: null,
  title: '',
  isPlaying: false,
  progress: 0,

  setSession: (readerId, title) => set({ readerId, title }),
  setPlaying: (isPlaying) => set({ isPlaying }),
  setProgress: (progress) => set({ progress }),
  clearSession: () => set({ readerId: null, title: '', isPlaying: false, progress: 0 }),
}));

/**
 * Tracks per-document reading progress (character offset into the body text).
 * Persisted to AsyncStorage so it survives app restarts.
 *
 * We store the char offset to the start of the *last completed chunk*, so
 * resuming always begins at a clean sentence boundary.
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ReadingProgressState = {
  /** Map of documentId -> char offset into the document body. */
  positions: Record<string, number>;

  getPosition: (docId: string) => number;
  savePosition: (docId: string, charOffset: number) => void;
  clearPosition: (docId: string) => void;
};

export const useReadingProgressStore = create<ReadingProgressState>()(
  persist(
    (set, get) => ({
      positions: {},

      getPosition: (docId) => get().positions[docId] ?? 0,

      savePosition: (docId, charOffset) =>
        set((state) => ({
          positions: { ...state.positions, [docId]: charOffset },
        })),

      clearPosition: (docId) =>
        set((state) => {
          const next = { ...state.positions };
          delete next[docId];
          return { positions: next };
        }),
    }),
    {
      name: 'reading-progress-v1',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ positions }) => ({ positions }),
    }
  )
);

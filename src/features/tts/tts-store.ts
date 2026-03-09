import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { INITIAL_MODEL_ID } from '@/lib/tts/constants';

const LEGACY_DEFAULT_MODEL_ID = 'en-us-amy';

type TtsUiState = {
  selectedModelId: string;
  sampleText: string;
  statusMessage: string;
  playbackRate: number;
  setSelectedModelId: (modelId: string) => void;
  setSampleText: (sampleText: string) => void;
  setStatusMessage: (statusMessage: string) => void;
  setPlaybackRate: (rate: number) => void;
};

export const useTtsUiStore = create<TtsUiState>()(
  persist(
    (set) => ({
      selectedModelId: INITIAL_MODEL_ID,
      sampleText: '',
      statusMessage: '',
      playbackRate: 1.0,
      setSelectedModelId: (selectedModelId) => set({ selectedModelId }),
      setSampleText: (sampleText) => set({ sampleText }),
      setStatusMessage: (statusMessage) => set({ statusMessage }),
      setPlaybackRate: (playbackRate) => set({ playbackRate }),
    }),
    {
      name: 'tts-ui-store',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        selectedModelId: state.selectedModelId, 
        sampleText: state.sampleText,
        playbackRate: state.playbackRate 
      }),
      migrate: (persistedState) => {
        const state = (persistedState ?? {}) as Partial<TtsUiState>;
        const persistedModelId =
          typeof state.selectedModelId === 'string' ? state.selectedModelId.trim() : '';
        const selectedModelId =
          persistedModelId && persistedModelId !== LEGACY_DEFAULT_MODEL_ID
            ? persistedModelId
            : INITIAL_MODEL_ID;
        const sampleText = typeof state.sampleText === 'string' ? state.sampleText : '';
        const playbackRate = typeof state.playbackRate === 'number' ? state.playbackRate : 1.0;
        return {
          selectedModelId,
          sampleText,
          statusMessage: '',
          playbackRate,
        };
      },
    }
  )
);

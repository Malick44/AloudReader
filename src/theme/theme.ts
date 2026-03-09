import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { create } from 'zustand';

const THEME_MODE_STORAGE_KEY = 'aloudreader.theme.mode';

export type ThemeMode = 'light' | 'dark' | 'system';

export type ThemeState = {
  mode: ThemeMode;
  hydrated: boolean;
  setMode: (mode: ThemeMode) => Promise<void>;
  hydrate: () => Promise<void>;
  resolvedMode: () => 'light' | 'dark';
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'system',
  hydrated: false,
  setMode: async (mode) => {
    await AsyncStorage.setItem(THEME_MODE_STORAGE_KEY, mode);
    set({ mode });
  },
  hydrate: async () => {
    const stored = await AsyncStorage.getItem(THEME_MODE_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      set({ mode: stored, hydrated: true });
      return;
    }
    set({ hydrated: true });
  },
  resolvedMode: () => {
    const mode = get().mode;
    if (mode === 'system') {
      return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
    }
    return mode;
  },
}));

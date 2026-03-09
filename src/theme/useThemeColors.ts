import { darkColors, lightColors, toHslColor, type SemanticColorTokens } from '@/styles/tokens/colors';

import { useThemeStore } from './theme';

export type ThemeColors = {
  [K in keyof SemanticColorTokens]: string;
};

function resolveColors(tokens: SemanticColorTokens): ThemeColors {
  return Object.fromEntries(
    Object.entries(tokens).map(([key, value]) => [key, toHslColor(value as string)])
  ) as ThemeColors;
}

const lightResolved = resolveColors(lightColors);
const darkResolved = resolveColors(darkColors);

export function useThemeColors(): ThemeColors {
  const resolvedMode = useThemeStore((state) => state.resolvedMode());
  return resolvedMode === 'dark' ? darkResolved : lightResolved;
}

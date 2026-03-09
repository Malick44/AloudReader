export type SemanticColorTokens = {
  background: string;
  foreground: string;
  surface: string;
  surfaceForeground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  input: string;
  ring: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  success: string;
  warning: string;
  info: string;
};

export const lightColors: SemanticColorTokens = {
  background: '210 36% 98%',
  foreground: '216 26% 14%',
  surface: '0 0% 100%',
  surfaceForeground: '216 26% 14%',
  muted: '210 30% 94%',
  mutedForeground: '216 15% 42%',
  border: '210 24% 86%',
  input: '210 24% 86%',
  ring: '206 86% 42%',
  primary: '206 85% 38%',
  primaryForeground: '210 40% 98%',
  secondary: '35 48% 90%',
  secondaryForeground: '28 35% 25%',
  accent: '196 55% 90%',
  accentForeground: '198 64% 24%',
  destructive: '358 75% 48%',
  destructiveForeground: '0 0% 100%',
  success: '156 70% 34%',
  warning: '36 92% 47%',
  info: '212 90% 46%',
};

export const darkColors: SemanticColorTokens = {
  background: '220 24% 10%',
  foreground: '210 30% 94%',
  surface: '221 23% 14%',
  surfaceForeground: '210 30% 94%',
  muted: '220 17% 21%',
  mutedForeground: '216 16% 70%',
  border: '219 15% 30%',
  input: '219 15% 30%',
  ring: '203 93% 62%',
  primary: '203 93% 62%',
  primaryForeground: '214 44% 10%',
  secondary: '35 38% 24%',
  secondaryForeground: '36 100% 88%',
  accent: '197 40% 22%',
  accentForeground: '196 70% 88%',
  destructive: '0 65% 56%',
  destructiveForeground: '0 0% 100%',
  success: '151 56% 54%',
  warning: '43 96% 58%',
  info: '205 96% 66%',
};

export const semanticColors = {
  light: lightColors,
  dark: darkColors,
};

export function toHslColor(token: string): string {
  return `hsl(${token})`;
}

# Design System Tokens

## Location

- Token source: `src/styles/tokens/**`
- Theme provider: `src/theme/ThemeProvider.tsx`
- Tailwind mapping: `tailwind.config.ts`

## Rules

- Add raw visual values only in token files.
- Use semantic classes in components (`bg-background`, `text-foreground`, etc.).
- Avoid arbitrary Tailwind values in component code.

## Adding a new theme token

1. Add token values in `src/styles/tokens/*`.
2. Map token in `tailwind.config.ts`.
3. Consume via semantic class names in components.

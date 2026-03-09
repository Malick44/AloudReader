# Design System Tokens

## Location

- Token source: `src/styles/tokens/**`
- Theme provider: `src/theme/ThemeProvider.tsx`
- Theme consumption: `src/theme/useThemeColors.ts`
- Shared UI primitives: `src/components/ui/**`

## Rules

- Add raw visual values only in token files.
- Use semantic theme values in components (`colors.background`,
  `colors.foreground`, etc.).
- Avoid raw visual literals in screen and component code when a token already
  exists.

## Adding a new theme token

1. Add token values in `src/styles/tokens/*`.
2. Expose or consume the token through the theme layer when needed.
3. Apply the token in shared UI primitives or screen styles using semantic
   names.

## Scope

This file defines visual building blocks such as color, spacing, and typography.

- Tokens answer: “what reusable visual values exist?”
- Component guidelines answer: “how should screens and controls use them?”
- Product identity answer: “what feeling and product character should the UI
  express?”

For product character and UX tone, see `docs/product-identity.md`.

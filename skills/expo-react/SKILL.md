---
name: expo-react
description: Build, modify, and troubleshoot Expo and React Native applications without Expo Go, using development builds/dev clients, Expo Router, Metro, and EAS Build/Submit/Update workflows. Use when requests involve creating or editing app screens/components, project-consistent UI/UX work, navigation and routing, dependency alignment for Expo SDK, iOS/Android runtime errors, native module integration, performance tuning, CI/CD build pipelines, or mobile release readiness for Expo-based projects.
---

# Expo React

## Overview

Use this skill to deliver Expo/React Native features and fixes with version-safe package choices, predictable debug loops, and release-aware validation.

## Quick Intake

1. Identify Expo SDK, package manager, and script entry points from `package.json`.
2. Detect routing approach (`expo-router` file-based routes or React Navigation config).
3. Detect workflow mode:
   - Managed workflow (no committed native projects).
   - Prebuild/bare workflow (`ios/` and `android/` present).
4. Confirm target platform and goal:
   - Local dev (simulator/device/web), CI build, store submission, or OTA update.
5. For UI work, inspect the project design system first:
   - Theme access via `src/theme/useThemeColors.ts`.
   - Visual tokens in `src/styles/tokens/**`.
   - Responsive layout rules in `src/shared/responsive/useResponsiveLayout.ts`.
   - Reusable primitives in `src/components/ui/**`.
   - Localization via `src/i18n/**`.

## Workflow

1. Implement feature work:
   - Use [setup-and-build.md](references/setup-and-build.md) for scaffolding, commands, and build flows.
    - Keep UI components focused and move reusable logic into hooks/services.
    - For screens and component changes, apply [ui-ux-consistency.md](references/ui-ux-consistency.md) before introducing new patterns.
2. Triage bugs:
   - Reproduce first with a clean cache and logs.
   - Follow playbooks in [troubleshooting.md](references/troubleshooting.md).
3. Prepare release changes:
   - Validate app config, runtime versioning, environment variables, and EAS profiles before building.

## UI/UX Excellence Rules For This Project

- Treat the existing token system as the source of truth:
   - Colors from `useThemeColors()`.
   - Spacing from `src/styles/tokens/spacing.ts`.
   - Typography from `src/styles/tokens/typography.ts`.
- Prefer existing primitives before adding new ones:
   - `Button`, `Input`, `Card`, `OfflineBanner`, `MiniPlayerBar`, and existing route-group layouts.
- Match current project styling conventions:
   - Prefer `StyleSheet.create(...)` plus semantic theme values.
   - Avoid raw hex colors, one-off spacing numbers, and ad hoc typography in screen code unless a token is missing.
- Build responsive layouts with `useResponsiveLayout()`:
   - Respect `screenPadding`, `sectionGap`, `contentMaxWidth`, `formMaxWidth`, and `readingMaxWidth`.
   - Do not optimize only for phone width; verify tablet behavior too.
- Design every user flow for state completeness:
   - loading, empty, success, error, offline, and disabled states.
- Keep copy fully localized:
   - Route all user-facing strings through `useAppTranslation()` and locale files.
- Accessibility is required, not optional:
   - Use correct roles/labels/hints, preserve readable contrast in light and dark mode, and keep touch targets comfortable.
- Maintain calm, low-friction UX for a reading/listening product:
   - Clear hierarchy, limited visual noise, obvious primary action, and safe destructive actions.
- Product identity should be explicit:
   - Use `docs/product-identity.md` as the source of truth for the product tone and experiential qualities the UI should express.

## Implementation Rules

- Do not use Expo Go; use development builds (dev clients) for local testing.
- Use `npx expo install` for packages that must align to Expo SDK versions.
- Use `npx expo-doctor` when dependency or config drift is suspected.
- Keep navigation changes consistent with the active router strategy:
  - Expo Router: implement file-based routes under `app/`.
  - React Navigation: update navigator declarations and param typing.
- Prefer config plugins over manual native file edits whenever possible.
- Use `EXPO_PUBLIC_` only for values safe to expose in client bundles.
- Keep secrets in EAS/CI secret stores; never hardcode credentials.
- Minimize platform-specific branches and isolate unavoidable divergence.
- When adding UI, check for an existing screen or component pattern in the same route group before inventing a new one.
- If a needed visual primitive is missing, add or extend a reusable component in `src/components/ui/` instead of duplicating styles across screens.

## Validation Checklist

- Run lint/typecheck/tests when available.
- Launch and verify changed flows on each target platform.
- Confirm there are no new runtime warnings related to hooks, navigation, or native modules.
- For UI changes, verify:
   - Light and dark themes.
   - Phone and tablet widths.
   - Localized copy fit for longer strings.
   - Empty/loading/error/offline states.
   - Accessibility roles, labels, and readable contrast.
- For release tasks, verify:
  - EAS profile selection.
  - Bundle identifier/package name continuity.
  - Runtime/update policy consistency.

## References

- Setup, scaffolding, and EAS commands: [setup-and-build.md](references/setup-and-build.md)
- Error triage and remediation patterns: [troubleshooting.md](references/troubleshooting.md)
- Project UI/UX consistency guide: [ui-ux-consistency.md](references/ui-ux-consistency.md)

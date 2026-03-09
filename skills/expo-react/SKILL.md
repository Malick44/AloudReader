---
name: expo-react
description: Build, modify, and troubleshoot Expo and React Native applications without Expo Go, using development builds/dev clients, Expo Router, Metro, and EAS Build/Submit/Update workflows. Use when requests involve creating or editing app screens/components, navigation and routing, dependency alignment for Expo SDK, iOS/Android runtime errors, native module integration, performance tuning, CI/CD build pipelines, or mobile release readiness for Expo-based projects.
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

## Workflow

1. Implement feature work:
   - Use [setup-and-build.md](references/setup-and-build.md) for scaffolding, commands, and build flows.
   - Keep UI components focused and move reusable logic into hooks/services.
2. Triage bugs:
   - Reproduce first with a clean cache and logs.
   - Follow playbooks in [troubleshooting.md](references/troubleshooting.md).
3. Prepare release changes:
   - Validate app config, runtime versioning, environment variables, and EAS profiles before building.

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

## Validation Checklist

- Run lint/typecheck/tests when available.
- Launch and verify changed flows on each target platform.
- Confirm there are no new runtime warnings related to hooks, navigation, or native modules.
- For release tasks, verify:
  - EAS profile selection.
  - Bundle identifier/package name continuity.
  - Runtime/update policy consistency.

## References

- Setup, scaffolding, and EAS commands: [setup-and-build.md](references/setup-and-build.md)
- Error triage and remediation patterns: [troubleshooting.md](references/troubleshooting.md)

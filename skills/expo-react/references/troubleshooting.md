# Expo React Troubleshooting

## Fast triage loop

1. Reproduce with minimal steps.
2. Capture exact error text and stack.
3. Clear caches and retry:
```bash
rm -rf node_modules
rm -f package-lock.json yarn.lock pnpm-lock.yaml
npm install
npx expo start --dev-client -c
```
4. Run health checks:
```bash
npx expo-doctor
```
5. Compare installed versions with Expo SDK requirements before patching code.

## Common failure patterns

### Metro resolution failures

Symptoms:
- "Unable to resolve module ..."

Actions:
- Verify dependency is installed in the current workspace.
- Reset Metro cache (`npx expo start --dev-client -c`).
- Check path aliases in `babel.config.js` / `tsconfig.json`.
- Remove stale symlink or monorepo hoisting assumptions.

### Invalid hook call / React duplication

Symptoms:
- Hook call warnings, duplicate React runtime behavior.

Actions:
- Verify only one React/React Native version is resolved.
- Inspect lockfile and dedupe conflicts.
- Align React versions with the active Expo SDK.

### Native module not found

Symptoms:
- "Native module cannot be null" or module lookup failures.

Actions:
- Install with `npx expo install` instead of plain `npm install` when possible.
- Run prebuild when required by the module.
- Rebuild app binaries after native dependency changes.

### iOS/Android build failure in EAS

Symptoms:
- Build stops during dependency install, Gradle, CocoaPods, or config phase.

Actions:
- Check `eas.json` profile and environment variable completeness.
- Verify bundle identifier/package name and signing credentials.
- Inspect plugin configuration for invalid app config values.
- Retry with a clean, explicit profile to isolate environment drift.

### Routing not matching expected screens

Symptoms:
- Blank screen, route not found, incorrect stack transitions.

Actions:
- Confirm routing strategy (Expo Router vs React Navigation) and avoid mixing assumptions.
- Verify route file names and directory placement for Expo Router.
- Verify navigator registration and param types for React Navigation.

### Unexpected Expo Go assumptions

Symptoms:
- Team instructions or scripts launch Expo Go by default.
- Features relying on native modules behave inconsistently.

Actions:
- Replace start commands with `npx expo start --dev-client`.
- Ensure `expo-dev-client` is installed.
- Build/install a development client (`npx expo run:ios`, `npx expo run:android`, or EAS development profile).

## Pre-release sanity checks

- Verify login and core user journey on at least one iOS and one Android target.
- Verify deep links and push-notification navigation handlers.
- Verify runtime version/update policy before OTA publish.
- Verify crash reporting is enabled for release builds.

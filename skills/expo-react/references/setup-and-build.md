# Expo React Setup and Build

## Project setup

1. Create or initialize a project:
```bash
npx create-expo-app@latest my-app
cd my-app
```
2. Install dev client support:
```bash
npx expo install expo-dev-client
```
3. Start development server for dev client (not Expo Go):
```bash
npx expo start --dev-client
```
4. Add Expo-compatible dependencies:
```bash
npx expo install <package-name>
```
5. Add non-Expo JavaScript dependencies:
```bash
npm install <package-name>
```

## Common development commands

```bash
# Start dev-client server with cleared Metro cache
npx expo start --dev-client -c

# Build and open iOS development client locally
npx expo run:ios

# Build and open Android development client locally
npx expo run:android

# Check dependency/config health
npx expo-doctor

# Export web build
npx expo export --platform web
```

## Routing and structure guidance

- Use file-based routes when `expo-router` is installed:
  - Put route files under `app/`.
  - Prefer co-locating screen-specific UI inside route folders.
- Use navigator-based routing when React Navigation is primary:
  - Keep navigator definitions centralized.
  - Define typed route params to avoid runtime mismatch.

## EAS setup

1. Initialize EAS in the project:
```bash
npx eas init
```
2. Configure build profiles in `eas.json` (`development`, `preview`, `production`).
3. Configure app identifiers and version fields in app config (`app.json` or `app.config.*`).

## Build development clients (no Expo Go)

```bash
# Build Android development client
npx eas build --platform android --profile development

# Build iOS development client
npx eas build --platform ios --profile development
```

## Build production and submit

```bash
# Build Android
npx eas build --platform android --profile production

# Build iOS
npx eas build --platform ios --profile production

# Submit Android
npx eas submit --platform android --latest

# Submit iOS
npx eas submit --platform ios --latest
```

## OTA updates

```bash
# Push update to a channel/branch
npx eas update --branch production --message "Fix login edge case"
```

Before publishing updates:
- Confirm runtime compatibility with the binary already in stores.
- Confirm update scope (channel/branch) matches rollout intent.
- Keep release notes specific and reversible.

## Environment variables

- Expose only safe client values with `EXPO_PUBLIC_*`.
- Keep private secrets in EAS secrets or CI secret stores.
- Validate env availability in build profiles before running production builds.

## Policy reminder

- Use dev clients for feature work and QA.
- Avoid Expo Go entirely for this skill's workflows.

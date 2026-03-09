# Setup Local TTS

## Prerequisites

- Node 20+
- Xcode + CocoaPods (iOS)
- Android Studio + SDK (Android)

## Install

```bash
npm install
```

## Run in development build mode

```bash
npm run ios
# or
npm run android
```

Do not use Expo Go for this project.

## Quality checks

```bash
npm run typecheck
npm run lint
npm run check:i18n
./scripts/check-data-boundaries.sh
```

## Environment variables

Set these for data SDK usage:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

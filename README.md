# AloudReader

Offline-first Expo/React Native reading app with local TTS architecture using a local Expo native module (`modules/expo-local-tts`) and a TypeScript runtime pipeline.

## Stack

- Expo SDK 55 + Expo Router + TypeScript
- Zustand state management
- Local Expo module (Swift + Kotlin)
- TTS service layer with model install/registry/chunk/cache/pipeline
- Fallback system TTS path for reliability
- Data SDK boundary for Supabase access (`src/data/**`)

## Commands

```bash
npm install
npm run ios
npm run android
npm run typecheck
npm run lint
npm run check:i18n
./scripts/check-data-boundaries.sh
```

## Notes

- Development build only. Do not use Expo Go.
- Sherpa-ONNX native synthesis is linked on Android/iOS in `modules/expo-local-tts`.
- See docs for binary wiring and troubleshooting:
  - `docs/implementation-tracker.md`
  - `docs/expo-local-tts-native-module.md`
  - `docs/adding-a-locale.md`
  - `docs/setup-local-tts.md`
  - `docs/troubleshooting-local-tts.md`

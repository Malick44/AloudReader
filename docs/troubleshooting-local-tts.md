# Troubleshooting Local TTS

## "Model file not found"

- Confirm model archive extraction completed.
- Confirm `model.onnx` exists in installed model directory.
- Reinstall the model and inspect registry entry paths.

## "Sherpa runtime not linked"

- Android: ensure `modules/expo-local-tts/android/libs/sherpa-onnx-1.12.28.aar` exists (auto-downloaded during Gradle build).
- iOS: run `bash modules/expo-local-tts/ios/scripts/ensure_sherpa_ios_binaries.sh` and reinstall pods (`npx expo run:ios` handles this).
- Rebuild native app after native module changes:
  - `npm run ios`
  - `npm run android`

## Metro/module issues

- Clear cache: `npx expo start --dev-client -c`
- Rebuild native app after module edits:
  - `npm run ios`
  - `npm run android`

## Supabase boundary violations

- Run `./scripts/check-data-boundaries.sh`
- Keep all Supabase imports and query strings inside `src/data/**` only.

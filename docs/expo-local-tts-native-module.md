# Expo Local TTS Native Module

## Module name

- JS name: `ExpoLocalTts`
- Path: `modules/expo-local-tts`

## Exposed JS methods

- `initialize(config)`
- `preloadModels(configs)`
- `synthesizeToFile(text, options)`
- `speak(text, options)`
- `stop()`
- `isReady(modelId)`
- `listInstalledModels()`
- `uninstallModel(modelId)`
- `getEngineStatus()`

## iOS and Android behavior today

- `initialize` creates a real Sherpa offline TTS engine per model and stores it in an in-memory cache keyed by `modelId`.
- `preloadModels` eagerly initializes engines using the same native path as `initialize`.
- `synthesizeToFile` uses Sherpa native generation and writes real WAV output files.
- `getEngineStatus` returns `available=true` when the native module is linked.
- `speak` intentionally remains unsupported in native and should continue to use JS playback (`expo-audio`) from synthesized files.

## Binary wiring details

1. Android downloads `sherpa-onnx-1.12.28.aar` automatically in `modules/expo-local-tts/android/build.gradle` via `downloadSherpaAar`.
2. iOS runs `modules/expo-local-tts/ios/scripts/ensure_sherpa_ios_binaries.sh` from podspec `prepare_command` and stores frameworks in `modules/expo-local-tts/ios/vendor`.
3. iOS podspec wires:
   - `vendor/onnxruntime.xcframework`
   - `vendor/sherpa-onnx.xcframework`
4. Bridging header: `modules/expo-local-tts/ios/ExpoLocalTts-Bridging-Header.h` imports Sherpa C API.

## Supported model-family mapping

- `piper` -> Sherpa VITS config path
- `vits` -> Sherpa VITS config path
- `kokoro` -> Sherpa Kokoro config path
- `matcha` -> Sherpa Matcha config path (expects a vocoder ONNX via `assets.configPath` or another `.onnx` in `installDir`)

# Local TTS Architecture

## Summary

AloudReader uses an Expo Router TypeScript app with a local Expo module (`modules/expo-local-tts`) for native TTS integration points, plus a TypeScript service layer under `src/lib/tts/` for model installation, registry persistence, chunking, caching, and playback orchestration.

## Core layers

1. App routes and feature screens (`app/`, `src/features/tts/`)
2. Model/service logic (`src/lib/tts/`)
3. Native bridge contracts (`modules/expo-local-tts/src/*`)
4. Native platform modules (Swift + Kotlin)

## Current native status

- Native methods are fully wired and callable.
- Sherpa-ONNX binaries are linked on Android and iOS.
- `synthesizeToFile()` is a real native path that generates WAV files.
- `speak()` remains intentionally unsupported in native; JS playback (`expo-audio`) is the primary path.
- JS fallback route (`expo-speech`) remains available when local synthesis fails.

## Storage layout

`<documentDirectory>/tts/`
- `registry.json`
- `downloads/`
- `cache/`
- `piper/`
- `kokoro/`
- `vits/`
- `matcha/`

# Local TTS Runtime Pipeline

## Stages

1. Normalize and chunk text (`chunker.ts`).
2. Generate deterministic cache key per chunk (`cache.ts`).
3. Reuse cached audio if present.
4. Synthesize missing chunks to cache-target path.
5. Initialize audio mode once (`audioSession.ts`) before any playback.
6. Play ordered chunks through one shared `expo-audio` `AudioPlayer` (`queue.ts`).
7. Advance queue on `playbackStatusUpdate.didJustFinish`.
8. If chunk synthesis fails and fallback is enabled, route chunk text to system TTS (`fallback.ts`).

## Determinism choices

- Chunking is sentence-aware and bounded by max chunk size.
- Cache key includes model ID + text + language + calibrated native synthesis speed.
- Cache path is stable: `<tts>/cache/<sha256>.wav`.

## Playback controls

- Queue control methods: `pause()`, `resume()`, `skipCurrent()`, `stop()`.
- Local TTS speed is baked into generated WAV chunks; Track Player stays at `1x` for generated speech.
- `stop()` always performs `player.pause()` then `player.remove()` before cleanup.
- Reader UI reads live transport state from `useAudioPlayerStatus()`.

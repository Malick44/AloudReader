# Acceptance Checklist

Tracker: `docs/implementation-tracker.md`

## Completed

- Expo Router TypeScript app scaffolded with dev-client-first scripts.
- Local Expo module created at `modules/expo-local-tts`.
- Shared TTS contracts and service layer implemented under `src/lib/tts/`.
- Model installer, registry, chunker, cache, pipeline, and demo screens implemented.
- System TTS fallback path implemented.
- Design token and theme scaffolding implemented.
- Supabase data access SDK boundary scaffold implemented in `src/data/**`.
- ESLint and grep guardrails added for style/data-boundary constraints.

## Manual remaining work

- Add production model catalog URLs/checksums.
- Run end-to-end QA on physical iOS and Android devices.

# AloudReader Implementation Tracker

Last updated: 2026-06-18

---

## Status summary

### Core TTS engine

| Area                                        | Status                 | Notes                                                                                                        |
| ------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------ |
| Expo SDK + Router scaffold                  | ✅ Complete            | SDK 55, dev-client scripts, Expo Router in place.                                                            |
| Local Expo native module (`expo-local-tts`) | ✅ Complete            | JS/TS bridge and native module interface wired.                                                              |
| Sherpa Android binary wiring                | ✅ Complete            | AAR auto-download in module Gradle (`sherpa-onnx-1.12.28.aar`).                                              |
| Sherpa iOS binary wiring                    | ✅ Complete            | Podspec `prepare_command` downloads/extracts xcframeworks to `ios/vendor`.                                   |
| Native `synthesizeToFile` (Android)         | ✅ Complete            | Real Sherpa generation + WAV writing implemented.                                                            |
| Native `synthesizeToFile` (iOS)             | ✅ Complete            | Sherpa C API generation + `SherpaOnnxWriteWave` implemented.                                                 |
| `speak()` native playback                   | ⏭ Deferred (by design) | Uses JS playback via `expo-audio` from synthesized files.                                                    |
| Model install / registry / validation       | ✅ Complete            | `model-installer.ts`, `model-registry.ts`, `model-validation.ts`, `file-layout.ts`, `path-utils.ts` present. |
| Model initialization resiliency             | ✅ Complete            | Stale registry entries with missing files are auto-cleaned before initialize.                                |
| Family asset validation hardening           | ✅ Complete            | Kokoro tokens/voices and Matcha acoustic+vocoder pairing enforced at install time.                           |
| Model catalog (Piper URLs + SHA-256)        | ✅ Complete            | Production artifact URLs with per-artifact checksums in `catalog.ts`.                                        |
| Text chunking                               | ✅ Complete            | `chunker.ts` — sentence-aware, configurable chunk size.                                                      |
| Synthesis queue + audio cache               | ✅ Complete            | `queue.ts`, `cache.ts` — cache-first, deterministic keys.                                                    |
| Long-form QA harness                        | ✅ Complete            | `qa.ts` + `PhysicalQaScreen` provide cold/warm cache benchmarking with JSON report output.                   |
| Playback pipeline (`expo-audio`)            | ✅ Complete            | `pipeline.ts` — single shared `AudioPlayer`, `didJustFinish` queue, pause/resume/skip/stop.                  |
| AudioSession initialization                 | ✅ Complete            | `audioSession.ts` — `playsInSilentMode` + `shouldDuckAndroid` configured at startup.                         |
| Fallback TTS                                | ✅ Complete            | `fallback.ts` — routes failed chunks to `expo-speech` when enabled.                                          |
| Language routing                            | ✅ Complete            | `language-routing.ts` present.                                                                               |
| `useLocalTtsReader` hook                    | ✅ Complete            | `src/features/tts/useLocalTtsReader.ts` exposes pipeline controls.                                           |
| TTS zustand store                           | ✅ Complete            | `src/features/tts/tts-store.ts` present.                                                                     |
| Reader session store                        | ✅ Complete            | `src/features/tts/reader-session-store.ts` — cross-screen playback state for MiniPlayerBar.                  |

### Design system

| Area                                     | Status      | Notes                                                                                |
| ---------------------------------------- | ----------- | ------------------------------------------------------------------------------------ |
| Design token layer                       | ✅ Complete | `src/styles/tokens/` — colors, typography, spacing, radii, shadows, motion, z-index. |
| Theme files (light + dark)               | ✅ Complete | `src/styles/themes/default.ts` and `dark.ts`.                                        |
| `ThemeProvider`                          | ✅ Complete | `src/theme/ThemeProvider.tsx`.                                                       |
| `useThemeColors` hook                    | ✅ Complete | `src/theme/useThemeColors.ts`.                                                       |
| `theme.ts` (mode + persistence)          | ✅ Complete | `src/theme/theme.ts`.                                                                |
| Base UI components (Button, Card, Input) | ✅ Complete | `src/components/ui/` — use semantic tokens via `useThemeColors()`.                   |
| `MiniPlayerBar`                          | ✅ Complete | `src/components/ui/MiniPlayerBar.tsx` — progress bar, play/pause/stop, router nav.   |
| `OfflineBanner`                          | ✅ Complete | `src/components/ui/OfflineBanner.tsx` — polls reachability every 15 s.               |
| `DownloadToast`                          | ✅ Complete | `src/components/ui/DownloadToast.tsx` — absolute overlay with optional progress bar. |

### Data access SDK (Supabase)

| Area                              | Status      | Notes                                                                  |
| --------------------------------- | ----------- | ---------------------------------------------------------------------- |
| Supabase client + env wiring      | ✅ Complete | `src/data/supabase/client.ts`, `names.ts`, `db.types.ts`.              |
| Codecs (Zod + DTOs)               | ✅ Complete | All 5 domains: documents, bookmarks, readingHistory, profiles, search. |
| Select shapes                     | ✅ Complete | `src/data/selects/` — all 5 domains.                                   |
| Query specs                       | ✅ Complete | `src/data/queries/` — documents, search.                               |
| Repositories                      | ✅ Complete | `src/data/repos/` — all 5 domains.                                     |
| RPC wrappers                      | ✅ Complete | `src/data/rpc/reading-history.rpc.ts`.                                 |
| Public API (`src/data/index.ts`)  | ✅ Complete | Present.                                                               |
| `check:data-boundaries` CI script | ✅ Complete | `scripts/check-data-boundaries.sh`.                                    |

### i18n

| Area                                        | Status      | Notes                                                                                                              |
| ------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------ |
| i18next + react-i18next + expo-localization | ✅ Complete | `src/i18n/index.ts`, `hooks.ts`, `types.ts` wired.                                                                 |
| en-US locale (source of truth)              | ✅ Complete | Extended: common, navigation (tab__), listen._, library._, search._, miniplayer.*, reader, settings, auth, errors. |
| fr-FR locale                                | ✅ Complete | Fully translated + expanded with all new keys.                                                                     |
| es-ES locale                                | ✅ Complete | Fully translated + expanded with all new keys.                                                                     |
| ar locale (RTL)                             | ✅ Complete | Fully translated + expanded with all new keys.                                                                     |
| Locale parity check script                  | ✅ Complete | `scripts/check-i18n-locales.mjs` + `npm run check:i18n`.                                                           |

### Text input sources (paste / URL / file)

| Area                            | Status      | Notes                                                                                                 |
| ------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------- |
| `src/lib/text/` directory       | ✅ Complete | All 6 files created.                                                                                  |
| Paste input normalizer          | ✅ Complete | `src/lib/text/paste-input.ts` — collapses blank lines, validates, returns `PasteExtractResult`.       |
| URL extractor                   | ✅ Complete | `src/lib/text/url-extractor.ts` — uses `htmlparser2` (pure JS, no DOM shim); AbortController timeout. |
| File extractor (txt + PDF stub) | ✅ Complete | `src/lib/text/file-extractor.ts` — `expo-document-picker` + `expo-file-system`; PDF typed TODO stub.  |
| Text source types + errors      | ✅ Complete | `src/lib/text/types.ts`, `errors.ts`, `index.ts` all created.                                         |
| Packages installed              | ✅ Complete | `expo-document-picker` (SDK 55) + `htmlparser2` installed.                                            |

### Navigation and screens

| Area                                                 | Status      | Notes                                                                                              |
| ---------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------- |
| Expo Router group-based layout                       | ✅ Complete | `app/_layout.tsx` rewritten — Stack with route-group screens declared.                             |
| Root layout (ThemeProvider + OfflineBanner overlay)  | ✅ Complete | `app/_layout.tsx` — ThemeProvider + SafeAreaProvider + OfflineBanner.                              |
| Auth group `(auth)/`                                 | ✅ Complete | `_layout.tsx`, `welcome.tsx`, `sign-in.tsx`, `sign-up.tsx`, `forgot-password.tsx`.                 |
| Tab bar `(tabs)/`                                    | ✅ Complete | `_layout.tsx` with 4 Tabs + MiniPlayerBar overlay wired to `reader-session-store`.                 |
| Library tab screen `(tabs)/index.tsx`                | ✅ Complete | FlatList from `listDocuments`, empty state, taps → `/(reader)/[id]`.                               |
| Listen tab screen `(tabs)/listen.tsx`                | ✅ Complete | Segmented Paste/URL/File — wires `src/lib/text/` extractors, preview, Listen CTA.                  |
| Search tab screen `(tabs)/search.tsx`                | ✅ Complete | TextInput + `searchDocuments({ q })` + FlatList results.                                           |
| Settings root screen `(tabs)/settings.tsx`           | ✅ Complete | Navigation list → each `(settings)/` sub-screen.                                                   |
| Reader screen `(reader)/[id].tsx`                    | ✅ Complete | Full-screen streaming player; handles `__new__` ad-hoc text and real doc IDs; syncs session store. |
| Document Detail `(library)/[id].tsx`                 | ✅ Complete | Loads `getDocumentDetail`, preview, Listen + Delete actions.                                       |
| Reading History `(library)/history.tsx`              | ✅ Complete | Lists documents sorted by `updated_desc`.                                                          |
| Voice Catalog `(settings)/voices/index.tsx`          | ✅ Complete | Lists installed + catalog, taps → detail screen.                                                   |
| Voice Detail + Install `(settings)/voices/[modelId]` | ✅ Complete | `installFromCatalog` / `uninstallModel` with loading states.                                       |
| Profile screen                                       | ✅ Complete | `(settings)/profile.tsx` — placeholder ready for Supabase auth wiring.                             |
| Appearance screen                                    | ✅ Complete | `(settings)/appearance.tsx` — light/dark/system via `useThemeStore().setMode()`.                   |
| Language screen                                      | ✅ Complete | `(settings)/language.tsx` — 4 locales via `i18n.changeLanguage()`.                                 |
| Playback screen                                      | ✅ Complete | `(settings)/playback.tsx` — speed picker (0.5×–2.0×).                                              |
| About screen                                         | ✅ Complete | `(settings)/about.tsx` — app name, version, description.                                           |

### Device QA

| Area                                 | Status     | Notes                                        |
| ------------------------------------ | ---------- | -------------------------------------------- |
| Android emulator / dev-client        | ✅ Pass    | APK build + install success.                 |
| iOS simulator                        | ✅ Pass    | CocoaPods + Xcode build success.             |
| Physical iOS device                  | ⚠️ Blocked | Developer Mode disabled on device.           |
| Physical Android device              | ⏳ Pending | No physical Android device attached.         |
| Long-form synthesis + cache (device) | ⚠️ Partial | Route implemented; device execution pending. |

---

## Latest verification

| Check                                                 | Result                                                               |
| ----------------------------------------------------- | -------------------------------------------------------------------- |
| `npx expo run:android`                                | ✅ pass (includes new `physical-qa` route)                           |
| `npx expo run:ios`                                    | ✅ pass (iPhone 15 Pro simulator)                                    |
| `npx expo run:ios --device 00008120-001045D822D0C01E` | ⚠️ fail — destination unavailable: Developer Mode disabled on device |
| `npx expo export --platform android`                  | ✅ pass                                                              |
| `npm run typecheck`                                   | ⚠️ pending recheck — screen scaffolding just created                 |
| `npm run lint`                                        | ✅ pass (pre-screen build)                                           |
| `npm run check:i18n`                                  | ⚠️ pending recheck — new keys added to all 4 locales                 |
| `npm run check:data-boundaries`                       | ✅ pass                                                              |

---

## Remaining implementation tasks

### High priority

1. **Supabase auth wiring in screens**
   - `(auth)/sign-in.tsx` + `(auth)/sign-up.tsx` — call
     `supabase.auth.signInWithPassword` / `signUp`
   - `(settings)/profile.tsx` — display user email, provide sign-out button
   - `app/_layout.tsx` — add `supabase.auth.getSession()` redirect to route
     guard

2. **PDF extraction**
   - `src/lib/text/file-extractor.ts` — implement via a native PDF library or
     remote extraction service
   - Currently a typed stub that throws `PDF_NOT_SUPPORTED`

3. **Default speed persistence in Playback screen**
   - Add `defaultRate: number` field to `useTtsUiStore` and wire into
     `toPipelineDefaults()`

### Medium priority

4. **Save document from Listen screen**
   - After extracting text, prompt user to save to library via
     `createDocument()`
   - Currently navigates directly to reader with `__new__` ID

5. **Bookmarks integration in reader**
   - `(reader)/[id].tsx` — add bottom sheet with bookmark list from
     `bookmarksRepo`

6. **Physical-device QA**
   - Execute `physical-qa` route on real iOS + Android hardware

---

## File inventory (current state)

```
app/
  _layout.tsx                       ← root layout with route group declarations
  index.tsx                         ← dev placeholder (kept for compat)
  tts-demo.tsx
  reader-demo.tsx
  benchmark.tsx
  (auth)/
    _layout.tsx                     ← Stack: welcome, sign-in, sign-up, forgot-password
    welcome.tsx
    sign-in.tsx
    sign-up.tsx
    forgot-password.tsx
  (tabs)/
    _layout.tsx                     ← Tabs (4) + MiniPlayerBar overlay
    index.tsx                       ← Library tab
    listen.tsx                      ← Listen tab (Paste / URL / File)
    search.tsx                      ← Search tab
    settings.tsx                    ← Settings navigation list
  (reader)/
    _layout.tsx
    [id].tsx                        ← Full-screen streaming reader
  (library)/
    _layout.tsx
    [id].tsx                        ← Document detail + listen + delete
    history.tsx                     ← Reading history list
  (settings)/
    _layout.tsx
    profile.tsx
    appearance.tsx
    language.tsx
    playback.tsx
    about.tsx
    voices/
      _layout.tsx
      index.tsx                     ← Model catalog (installed + available)
      [modelId].tsx                 ← Install / uninstall voice

src/
  lib/
    tts/                            ← COMPLETE (19+ files)
    text/                           ← COMPLETE (types, errors, paste-input, url-extractor, file-extractor, index)
  features/tts/
    useLocalTtsReader.ts            ← COMPLETE
    reader-session-store.ts         ← NEW — cross-screen playback state
    tts-store.ts                    ← COMPLETE
  components/ui/
    Button.tsx                      ← COMPLETE
    Card.tsx                        ← COMPLETE
    Input.tsx                       ← COMPLETE
    MiniPlayerBar.tsx               ← NEW
    OfflineBanner.tsx               ← NEW
    DownloadToast.tsx               ← NEW
  data/                             ← COMPLETE (all 5 domains)
  i18n/                             ← COMPLETE (4 locales, expanded with all new keys)
  styles/tokens/                    ← COMPLETE
  styles/themes/                    ← COMPLETE
  theme/                            ← COMPLETE

modules/expo-local-tts/             ← COMPLETE
scripts/                            ← COMPLETE
docs/                               ← COMPLETE + tracker updated
```

---

## Status summary

### Core TTS engine

| Area                                        | Status                 | Notes                                                                                                        |
| ------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------ |
| Expo SDK + Router scaffold                  | ✅ Complete            | SDK 55, dev-client scripts, Expo Router in place.                                                            |
| Local Expo native module (`expo-local-tts`) | ✅ Complete            | JS/TS bridge and native module interface wired.                                                              |
| Sherpa Android binary wiring                | ✅ Complete            | AAR auto-download in module Gradle (`sherpa-onnx-1.12.28.aar`).                                              |
| Sherpa iOS binary wiring                    | ✅ Complete            | Podspec `prepare_command` downloads/extracts xcframeworks to `ios/vendor`.                                   |
| Native `synthesizeToFile` (Android)         | ✅ Complete            | Real Sherpa generation + WAV writing implemented.                                                            |
| Native `synthesizeToFile` (iOS)             | ✅ Complete            | Sherpa C API generation + `SherpaOnnxWriteWave` implemented.                                                 |
| `speak()` native playback                   | ⏭ Deferred (by design) | Uses JS playback via `expo-audio` from synthesized files.                                                    |
| Model install / registry / validation       | ✅ Complete            | `model-installer.ts`, `model-registry.ts`, `model-validation.ts`, `file-layout.ts`, `path-utils.ts` present. |
| Model initialization resiliency             | ✅ Complete            | Stale registry entries with missing files are auto-cleaned before initialize.                                |
| Family asset validation hardening           | ✅ Complete            | Kokoro tokens/voices and Matcha acoustic+vocoder pairing enforced at install time.                           |
| Model catalog (Piper URLs + SHA-256)        | ✅ Complete            | Production artifact URLs with per-artifact checksums in `catalog.ts`.                                        |
| Text chunking                               | ✅ Complete            | `chunker.ts` — sentence-aware, configurable chunk size.                                                      |
| Synthesis queue + audio cache               | ✅ Complete            | `queue.ts`, `cache.ts` — cache-first, deterministic keys.                                                    |
| Long-form QA harness                        | ✅ Complete            | `qa.ts` + `PhysicalQaScreen` provide cold/warm cache benchmarking with JSON report output.                   |
| Playback pipeline (`expo-audio`)            | ✅ Complete            | `pipeline.ts` — single shared `AudioPlayer`, `didJustFinish` queue, pause/resume/skip/stop.                  |
| AudioSession initialization                 | ✅ Complete            | `audioSession.ts` — `playsInSilentMode` + `shouldDuckAndroid` configured at startup.                         |
| Fallback TTS                                | ✅ Complete            | `fallback.ts` — routes failed chunks to `expo-speech` when enabled.                                          |
| Language routing                            | ✅ Complete            | `language-routing.ts` present.                                                                               |
| `useLocalTtsReader` hook                    | ✅ Complete            | `src/features/tts/useLocalTtsReader.ts` exposes pipeline controls.                                           |
| TTS zustand store                           | ✅ Complete            | `src/features/tts/tts-store.ts` present.                                                                     |

### Design system

| Area                                     | Status         | Notes                                                                                |
| ---------------------------------------- | -------------- | ------------------------------------------------------------------------------------ |
| Design token layer                       | ✅ Complete    | `src/styles/tokens/` — colors, typography, spacing, radii, shadows, motion, z-index. |
| Theme files (light + dark)               | ✅ Complete    | `src/styles/themes/default.ts` and `dark.ts`.                                        |
| `ThemeProvider`                          | ✅ Complete    | `src/theme/ThemeProvider.tsx`.                                                       |
| `useThemeColors` hook                    | ✅ Complete    | `src/theme/useThemeColors.ts`.                                                       |
| `theme.ts` (mode + persistence)          | ✅ Complete    | `src/theme/theme.ts`.                                                                |
| Base UI components (Button, Card, Input) | ✅ Complete    | `src/components/ui/` — use semantic tokens via `useThemeColors()`.                   |
| Persistent UI components                 | ❌ Not started | `MiniPlayerBar`, `OfflineBanner`, `DownloadToast` not yet created.                   |

### Data access SDK (Supabase)

| Area                              | Status      | Notes                                                                  |
| --------------------------------- | ----------- | ---------------------------------------------------------------------- |
| Supabase client + env wiring      | ✅ Complete | `src/data/supabase/client.ts`, `names.ts`, `db.types.ts`.              |
| Codecs (Zod + DTOs)               | ✅ Complete | All 5 domains: documents, bookmarks, readingHistory, profiles, search. |
| Select shapes                     | ✅ Complete | `src/data/selects/` — all 5 domains.                                   |
| Query specs                       | ✅ Complete | `src/data/queries/` — documents, search.                               |
| Repositories                      | ✅ Complete | `src/data/repos/` — all 5 domains.                                     |
| RPC wrappers                      | ✅ Complete | `src/data/rpc/reading-history.rpc.ts`.                                 |
| Public API (`src/data/index.ts`)  | ✅ Complete | Present.                                                               |
| `check:data-boundaries` CI script | ✅ Complete | `scripts/check-data-boundaries.sh`.                                    |

### i18n

| Area                                        | Status      | Notes                                                    |
| ------------------------------------------- | ----------- | -------------------------------------------------------- |
| i18next + react-i18next + expo-localization | ✅ Complete | `src/i18n/index.ts`, `hooks.ts`, `types.ts` wired.       |
| en-US locale (source of truth)              | ✅ Complete | `src/i18n/locales/en-US/translation.json`.               |
| fr-FR locale                                | ✅ Complete | `src/i18n/locales/fr-FR/translation.json`.               |
| es-ES locale                                | ✅ Complete | `src/i18n/locales/es-ES/translation.json`.               |
| ar locale (RTL)                             | ✅ Complete | `src/i18n/locales/ar/translation.json`.                  |
| Locale parity check script                  | ✅ Complete | `scripts/check-i18n-locales.mjs` + `npm run check:i18n`. |

### Text input sources (paste / URL / file)

| Area                            | Status         | Notes                                                                                 |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------------- |
| `src/lib/text/` directory       | ❌ Not started | Entire layer missing.                                                                 |
| Paste input normalizer          | ❌ Not started | `src/lib/text/paste-input.ts` — not created.                                          |
| URL extractor                   | ❌ Not started | `src/lib/text/url-extractor.ts` — not created; `@mozilla/readability` not installed.  |
| File extractor (txt + PDF stub) | ❌ Not started | `src/lib/text/file-extractor.ts` — not created; `expo-document-picker` not installed. |
| Text source types + errors      | ❌ Not started | `src/lib/text/types.ts`, `errors.ts`, `index.ts` — not created.                       |

### Navigation and screens

| Area                                                 | Status         | Notes                                                                                                           |
| ---------------------------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------- |
| Expo Router group-based layout                       | ❌ Not started | `app/` is currently flat: `index.tsx`, `tts-demo.tsx`, `reader-demo.tsx`, `benchmark.tsx`. No route groups yet. |
| Root layout (full ThemeProvider + redirect)          | ⚠️ Partial     | `app/_layout.tsx` exists but lacks Supabase session redirect and group router structure.                        |
| Auth group `(auth)/`                                 | ❌ Not started | welcome, sign-in, sign-up, forgot-password screens missing.                                                     |
| Tab bar `(tabs)/`                                    | ❌ Not started | Library, Listen, Search, Settings tabs not created.                                                             |
| Library tab screen                                   | ❌ Not started | Document list + empty state + history cards.                                                                    |
| Listen tab screen (Paste / URL / File)               | ❌ Not started | Three-mode segmented screen not created.                                                                        |
| Search tab screen                                    | ❌ Not started | Not created.                                                                                                    |
| Settings root screen                                 | ❌ Not started | Not created.                                                                                                    |
| Reader screen `(reader)/[id]`                        | ❌ Not started | Full-screen playback UI not created (demo at `reader-demo.tsx` only).                                           |
| Document Detail `(library)/[id]`                     | ❌ Not started | Not created.                                                                                                    |
| Reading History `(library)/history`                  | ❌ Not started | Not created.                                                                                                    |
| Voice Catalog `(settings)/voices/index`              | ❌ Not started | Not created.                                                                                                    |
| Voice Detail + Install `(settings)/voices/[modelId]` | ❌ Not started | Not created.                                                                                                    |
| Profile, Appearance, Language, Playback, About       | ❌ Not started | None created.                                                                                                   |

### Device QA

| Area                                 | Status     | Notes                                                                                   |
| ------------------------------------ | ---------- | --------------------------------------------------------------------------------------- |
| Android emulator / dev-client        | ✅ Pass    | APK build + install success.                                                            |
| iOS simulator                        | ✅ Pass    | CocoaPods + Xcode build success.                                                        |
| Physical iOS device                  | ⚠️ Blocked | Device detected, but Developer Mode is disabled on device.                              |
| Physical Android device              | ⏳ Pending | No physical Android device attached in current session.                                 |
| Long-form synthesis + cache (device) | ⚠️ Partial | In-app physical QA route implemented; pending execution on real iOS + Android hardware. |

---

## Latest verification

| Check                                                 | Result                                                                        |
| ----------------------------------------------------- | ----------------------------------------------------------------------------- |
| `npx expo run:android`                                | ✅ pass (includes new `physical-qa` route)                                    |
| `npx expo run:ios`                                    | ✅ pass (iPhone 15 Pro simulator)                                             |
| `npx expo run:ios --device 00008120-001045D822D0C01E` | ⚠️ fail — destination unavailable: Developer Mode disabled on device          |
| `npx expo export --platform android`                  | ✅ pass                                                                       |
| `npm run typecheck`                                   | ⚠️ fail — existing `src/lib/text/url-extractor.ts` type errors (pre-existing) |
| `npm run lint`                                        | ✅ pass                                                                       |
| `npm run check:i18n`                                  | ✅ pass                                                                       |
| `npm run check:data-boundaries`                       | ✅ pass                                                                       |
| Stale-registry simulation                             | ✅ pass — auto-cleaned to 0; fresh install + initialize succeeded             |
| iOS Sherpa binary fetch                               | ✅ pass — `modules/expo-local-tts/ios/vendor/*` created                       |
| Catalog checksum + family-validation patch            | ✅ pass                                                                       |

---

## Remaining implementation tasks

### High priority — blocking all screens

1. **Prompt 12 — Screen scaffolding and navigation map**
   - Migrate `app/` from flat layout to Expo Router route groups: `(auth)`,
     `(tabs)`, `(reader)`, `(library)`, `(settings)`
   - Scaffold all 21 screen files (see screen map in
     `expo-sherpa-onnx-agent-prompts.md § Screen map`)
   - Create persistent UI components: `MiniPlayerBar`, `OfflineBanner`,
     `DownloadToast` in `src/components/ui/`
   - Wire `MiniPlayerBar` into `(tabs)/_layout.tsx` consuming
     `useLocalTtsReader()`
   - Add Supabase session-based auth redirect in `app/_layout.tsx`

2. **Prompt 11 — Text input sources (paste, URL, file)**
   - Install `@mozilla/readability` and a React Native-compatible DOMParser shim
   - Install `expo-document-picker` (not yet in `package.json`)
   - Create `src/lib/text/` layer: `types.ts`, `errors.ts`, `paste-input.ts`,
     `url-extractor.ts`, `file-extractor.ts`, `index.ts`
   - Wire all three input modes into the Listen tab screen and
     `useLocalTtsReader()`

### Medium priority

3. Add `navigation.*` i18n keys to `en-US/translation.json` for tab bar labels
   and screen titles
4. Add screen-namespace i18n keys for each new route (auth._, reader._,
   settings.*, etc.)

### Low priority

5. Physical-device QA (iOS + Android) — execute `physical-qa` route on both real
   devices and capture report files + audio quality observations
6. PDF text extraction — implement properly (currently a typed stub TODO in
   `file-extractor.ts`)
7. OfflineBanner network-reachability hook

---

## Risks / caveats

- `@mozilla/readability` requires a compatible DOMParser shim in React Native —
  document the chosen approach in `src/lib/text/url-extractor.ts`.
- `expo-document-picker` is **not yet in `package.json`** — add it before
  running Prompt 11.
- Matcha needs both acoustic and vocoder ONNX assets; native mapping expects a
  second ONNX to be discoverable.
- iOS frameworks are downloaded during pod setup; offline CI environments need a
  cached artifact strategy.
- `speak()` intentionally stays non-native; all playback stays in `expo-audio`.

---

## File inventory (actual current state)

```
app/                          ← FLAT (no route groups yet)
  _layout.tsx                 ← partial — no session redirect, no group structure
  index.tsx                   ← dev placeholder
  tts-demo.tsx
  reader-demo.tsx
  benchmark.tsx
  physical-qa.tsx

src/
  lib/
    tts/                      ← COMPLETE (19+ files, includes qa.ts + cache QA helpers)
    text/                     ← MISSING — needs Prompt 11
  features/tts/               ← useLocalTtsReader.ts, ReaderDemoScreen.tsx, TtsDemoScreen.tsx, PhysicalQaScreen.tsx, tts-store.ts
  components/ui/              ← Button.tsx, Card.tsx, Input.tsx
                                 MiniPlayerBar / OfflineBanner / DownloadToast MISSING
  data/                       ← COMPLETE (supabase/, codecs/, selects/, queries/, repos/, rpc/, index.ts)
  i18n/                       ← COMPLETE (4 locales, typed hooks, parity script)
  styles/tokens/              ← COMPLETE (colors, typography, spacing, radii, shadows, motion, z-index)
  styles/themes/              ← COMPLETE (default.ts, dark.ts)
  theme/                      ← COMPLETE (ThemeProvider.tsx, theme.ts, useThemeColors.ts)

modules/expo-local-tts/       ← COMPLETE
scripts/                      ← COMPLETE (check-data-boundaries.sh, check-i18n-locales.mjs)
docs/                         ← COMPLETE (12+ doc files)
```

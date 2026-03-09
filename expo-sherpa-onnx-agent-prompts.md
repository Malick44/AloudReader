# Expo + React Native + Sherpa-ONNX TTS Agent Prompt Pack

This file contains reusable prompts you can give to an LLM coding agent to
generate an entire offline TTS project for an Expo / React Native app using
Sherpa-ONNX with support for Piper, Kokoro, VITS, and Matcha.

Use these prompts in order. The safest workflow is:

1. Run Prompt 1 to generate the architecture and implementation plan.
2. Run Prompt 2 to scaffold the repository and install dependencies.
3. Run Prompt 12 to scaffold all screens and the Expo Router navigation tree.
4. Run Prompt 3 to generate the local Expo native module.
5. Run Prompt 4 to implement the model installer and storage layer.
6. Run Prompt 5 to implement chunking, caching, and playback.
7. Run Prompt 11 to implement text input from paste, URL, and file.
8. Run Prompt 10 to implement multi-language support and i18n.
9. Run Prompt 6 to validate, fix defects, and produce final docs.
10. **After every prompt**, run `npx expo run:android` and confirm the app
    builds and loads without errors before moving to the next step.

If your agent is strong enough, you can also try the One-shot prompt near the
end.

---

## Project target

Build a production-grade Expo / React Native app that provides fully local
text-to-speech using Sherpa-ONNX.

### Required architecture

- Expo app with TypeScript
- Expo development build, not Expo Go
- Local Expo native module inside `modules/`
- iOS native implementation in Swift
- Android native implementation in Kotlin
- JS / TS wrapper API for the app layer
- Support for multiple Sherpa-ONNX TTS model families:
  - Piper
  - Kokoro
  - VITS
  - Matcha
- Model download and installation into app storage
- Registry of installed models
- Chunked synthesis to audio files
- Audio cache and playback queue powered by expo-audio
- Lock-screen / notification controls via expo-audio AudioSession
- Fallback to system TTS if local synthesis fails

### Product goals

- True offline TTS after model download
- Clean architecture with no hard-coded paths
- Multi-model support through a normalized config layer
- Long-form reading support for PDF, article, or note content
- **Pasted text input** — user pastes any text directly into the app and listens
  to it
- **URL text input** — user provides a URL; the app fetches the page, extracts
  the readable article body, and reads it aloud
- **File text input** — user selects a local file (plain text `.txt`, PDF
  `.pdf`, or EPUB `.epub`); the app extracts the text and reads it aloud
- Maintainable, production-ready code with documentation

### Screen map

#### Auth flow — `(auth)/`

| Screen               | Route                    | Purpose                                                                               |
| -------------------- | ------------------------ | ------------------------------------------------------------------------------------- |
| Welcome / Onboarding | `(auth)/welcome`         | First-launch carousel: app value prop, permissions ask, default voice download prompt |
| Sign In              | `(auth)/sign-in`         | Email + password, magic link, OAuth                                                   |
| Sign Up              | `(auth)/sign-up`         | Account creation                                                                      |
| Forgot Password      | `(auth)/forgot-password` | Reset email trigger                                                                   |

#### Main tab bar — `(tabs)/`

| Tab          | Route             | Purpose                                                         |
| ------------ | ----------------- | --------------------------------------------------------------- |
| **Library**  | `(tabs)/index`    | Saved document list, recent history cards, empty-state CTA      |
| **Listen**   | `(tabs)/listen`   | Three-mode input: Paste · URL · File — primary creation surface |
| **Search**   | `(tabs)/search`   | Full-text / semantic search over the document catalog           |
| **Settings** | `(tabs)/settings` | Profile, voices, language, theme, playback                      |

#### Reader stack — `(reader)/`

| Screen          | Route                      | Purpose                                                                                             |
| --------------- | -------------------------- | --------------------------------------------------------------------------------------------------- |
| Reader          | `(reader)/[id]`            | Full-screen playback: progress bar, play/pause/stop/skip-chunk, speed control, lock-screen controls |
| Bookmarks sheet | Bottom sheet inside Reader | Saved positions for the current document; tap to jump                                               |

#### Library stack — `(library)/`

| Screen          | Route               | Purpose                                                  |
| --------------- | ------------------- | -------------------------------------------------------- |
| Document Detail | `(library)/[id]`    | Metadata, reading history, "Start listening" CTA, delete |
| Reading History | `(library)/history` | Chronological list with resume button                    |

#### Settings sub-screens — `(settings)/`

| Screen                 | Route                         | Purpose                                                          |
| ---------------------- | ----------------------------- | ---------------------------------------------------------------- |
| Voice Catalog          | `(settings)/voices/index`     | Browse voices by language/family; installed badge; storage usage |
| Voice Detail + Install | `(settings)/voices/[modelId]` | Voice preview, download progress, install / uninstall            |
| Profile                | `(settings)/profile`          | Avatar, display name, email, sign out                            |
| Appearance             | `(settings)/appearance`       | Light / dark / system theme toggle                               |
| Language               | `(settings)/language`         | App locale picker                                                |
| Playback               | `(settings)/playback`         | Default speed, chunk size, fallback TTS toggle                   |
| About                  | `(settings)/about`            | App version, licenses, support link                              |

#### Persistent UI elements

- **Mini-player bar** — floats above the tab bar while a session is active;
  shows title, play/pause, progress; taps open the full Reader
- **Download progress toast** — non-blocking overlay during model or document
  fetch
- **Offline banner** — shown when network is unavailable; pure offline playback
  remains functional

#### Expo Router folder layout

```
app/
  _layout.tsx              — root layout: ThemeProvider, AudioSession init, i18n init
  (auth)/
    _layout.tsx
    welcome.tsx
    sign-in.tsx
    sign-up.tsx
    forgot-password.tsx
  (tabs)/
    _layout.tsx            — bottom tab bar + MiniPlayerBar overlay
    index.tsx              — Library
    listen.tsx             — Paste / URL / File
    search.tsx
    settings.tsx
  (reader)/
    _layout.tsx
    [id].tsx               — Reader + lock-screen controls
  (library)/
    [id].tsx               — Document Detail
    history.tsx
  (settings)/
    voices/
      index.tsx
      [modelId].tsx
    profile.tsx
    appearance.tsx
    language.tsx
    playback.tsx
    about.tsx
```

### Constraints

- Do not use Expo Go for the final implementation
- Prefer a local Expo module over ad-hoc native edits
- Use TypeScript across JS / app code
- Use clear interfaces and avoid hard-coded query strings or asset paths
- Produce code that can compile on both iOS and Android
- Prefer synthesize-to-file first, then playback from file
- Use expo-audio as the audio playback engine — never use expo-av or
  react-native-track-player for TTS playback
- Favor boring, reliable architecture over clever shortcuts
- Never hard-code user-visible text strings inside components or screens; all UI
  text must go through the i18n translation layer
- Every translation key must have a fallback value in English (en-US)

### Output expectations for the agent

- Return real files and code, not only pseudocode
- Update existing files instead of duplicating logic
- Explain tradeoffs briefly only when needed
- Keep folder structure consistent
- Mark all TODOs explicitly if something cannot be completed
- Never pretend a native API exists if it is not implemented
- **After completing any implementation step, always run `npx expo run:android`
  and verify the app builds and loads successfully. Fix any build or runtime
  errors before considering the step done.**

---

## Prompt 1 - Architecture and execution plan

Copy and paste this first.

```text
You are a senior mobile platform engineer and repository architect. I need you to design and then generate a production-ready Expo / React Native project that implements fully local TTS using Sherpa-ONNX.

Project identity — use these exact values, do not invent alternatives:
- App name: AloudReader
- iOS bundle ID: com.ai-orbit-studio.aloudreader
- Android package name: com.aiorbitstudio.aloudreader
- Expo SDK: latest stable (scaffold with npx create-expo-app@latest --template default@sdk-55)
- Navigation: Expo Router
- State management: zustand
- Default language: en-US
- Initial TTS model family: piper
- Initial TTS model ID: en-us-amy
- Model catalog: local seed file at src/lib/tts/catalog.ts (no remote URL needed at this stage)
- Fallback to system TTS: enabled
- Audio output format: wav

Project requirements:
- Expo app with TypeScript
- Development build only, not Expo Go
- Local Expo native module under modules/
- Swift implementation for iOS
- Kotlin implementation for Android
- Support Sherpa-ONNX TTS model families: Piper, Kokoro, VITS, Matcha
- JS API should expose initialize(), preloadModels(), synthesizeToFile(), speak(), stop(), isReady(), listInstalledModels(), uninstallModel()
- Audio generation must work offline after model installation
- Models should be downloaded into app storage, extracted, validated, and registered locally
- Text should be chunked before synthesis
- Playback should read from generated audio files
- Add fallback path to system TTS if local engine fails
- Keep architecture clean and extensible
- Support three text input modes:
  - Paste mode — user types or pastes raw text into a text field
  - URL mode — user provides a URL; app fetches and extracts readable article body using Mozilla Readability
  - File mode — user picks a local file (txt, pdf); app extracts raw text via expo-document-picker and a text extraction layer

Your tasks in this step:
1. Inspect the current repository structure.
2. Propose the final folder structure.
3. Identify all required dependencies and native integration points.
4. Produce an implementation plan split into phases.
5. List risks, assumptions, and platform caveats.
6. Do not generate all code yet. First create a concrete execution plan and file map.

Important rules:
- Assume this is a real production app, not a demo.
- Do not use vague placeholders where a concrete file is needed.
- Prefer a local Expo module over direct edits scattered through native folders.
- Normalize model config in TypeScript and map it to family-specific native configs internally.
- Start with synthesize-to-file, then playback from file.
- Highlight what should be built first for a stable vertical slice.

Output format:
- Section 1: Architecture summary
- Section 2: Final folder tree
- Section 3: Dependencies
- Section 4: Native integration plan
- Section 5: Model asset strategy
- Section 6: Execution phases
- Section 7: Acceptance criteria
```

---

## Prompt 2 - Scaffold the repository and shared TypeScript contracts

Use this after Prompt 1.

```text
Now implement Phase 1 and Phase 2 of the plan.

Project identity reminder — use these values throughout scaffolding:
- App name: AloudReader
- iOS bundle ID: com.ai-orbit-studio.aloudreader
- Android package name: com.aiorbitstudio.aloudreader
- Expo SDK: latest stable (scaffold with npx create-expo-app@latest --template default@sdk-55)
- Navigation: Expo Router
- State management: zustand
- Default language: en-US

Generate or update the project so it includes:
- Expo app scaffolding compatible with a development build
- Local Expo module under modules/expo-local-tts
- Shared TypeScript types for model family, model config, synthesis options, engine status, installed model registry entry
- A clean service layer under src/lib/tts/
- A demo screen that can initialize one installed model, synthesize a short sentence to file, and play it back
- Configuration files and scripts needed to run the project locally

Required folder targets:
- modules/expo-local-tts/
- src/lib/tts/
- src/features/tts/
- src/app or app/ depending on repository style
- docs/

Implement these files with real code:
- src/lib/tts/types.ts
- src/lib/tts/index.ts
- src/lib/tts/errors.ts
- src/lib/tts/constants.ts
- src/features/tts/TtsDemoScreen.tsx
- docs/local-tts-architecture.md

Define these TypeScript contracts:
- TtsModelFamily = 'piper' | 'kokoro' | 'vits' | 'matcha'
- TtsModelConfig
- SpeakOptions
- SynthesizeOptions
- InstalledModel
- EngineStatus

Rules:
- Do not hard-code absolute file paths.
- Use clear typing and error handling.
- Keep the JS layer model-family agnostic.
- The native layer will handle family-specific mapping later.
- Make the demo screen simple and testable.

Also add package scripts for:
- ios
- android
- typecheck
- lint
- clean

Return:
- The exact files created or modified
- Full code for each file
- Any follow-up steps needed before native implementation
```

---

## Prompt 3 - Generate the local Expo native module for Sherpa-ONNX

This is the most important prompt. Use it after scaffolding.

```text
Now generate the native implementation for a local Expo module named expo-local-tts.

Goal:
Create a local Expo native module that wraps Sherpa-ONNX TTS for iOS and Android and exposes a stable JS API to the Expo app.

Module requirements:
- Name: expo-local-tts
- iOS implementation in Swift
- Android implementation in Kotlin
- JS bridge available to TypeScript app code
- Support normalized input config from JS
- Internally map the config to the correct Sherpa-ONNX family-specific TTS config
- First-class support for synthesizeToFile()
- Optional speak() method can play generated file or reuse synthesizeToFile internally

Required JS-facing methods:
- initialize(config: TtsModelConfig): Promise<void>
- preloadModels(configs: TtsModelConfig[]): Promise<void>
- synthesizeToFile(text: string, options: SynthesizeOptions): Promise<string>
- speak(text: string, options: SpeakOptions): Promise<void>
- stop(): Promise<void>
- isReady(modelId: string): Promise<boolean>
- listInstalledModels(): Promise<InstalledModel[]>
- uninstallModel(modelId: string): Promise<void>
- getEngineStatus(): Promise<EngineStatus>

Native requirements:
- Keep a synthesizer instance cache keyed by modelId
- Validate all required files before initializing a model
- Return helpful native error messages back to JS
- Save generated WAV files into an app-safe writable directory
- Avoid hard-coded assumptions that only work for one model family

Family-specific rules:
- Piper path should support modelPath, tokensPath, and optionally dataDirPath for espeak-ng-data
- VITS path should support modelPath, tokensPath, optional lexiconPath, optional ruleFstsPaths, optional speakerId
- Kokoro path should support the assets required by the selected converted Sherpa model
- Matcha path should support the assets required by the selected converted Sherpa model
- If exact family assets vary by model, isolate that logic in mapper/helper functions instead of pushing complexity into the JS layer

Files to generate or update:
- modules/expo-local-tts/src/ExpoLocalTtsModule.ts
- modules/expo-local-tts/src/ExpoLocalTts.types.ts
- modules/expo-local-tts/ios/... Swift files
- modules/expo-local-tts/android/... Kotlin files
- Any config plugin or module definition files needed by Expo modules
- docs/expo-local-tts-native-module.md

Implementation rules:
- Use real code, not pseudocode
- Keep methods small and composable
- Add comments only where they clarify a non-obvious design choice
- Separate model validation, config mapping, synthesis, and file writing
- Prefer synthesize-to-file first; playback logic can be minimal
- If a method is not fully implementable without repository-specific details, leave a clearly named TODO and continue the rest

Validation requirements:
- Include one example TypeScript call site showing how the app initializes a Piper model and synthesizes a file
- Include notes for how to attach Sherpa-ONNX binaries or package references on both platforms
- Include platform-specific caveats at the end

Return full code for all files touched.
```

---

## Prompt 4 - Implement model download, install, extraction, and registry

Use this after the native module exists.

```text
Now implement the model management layer for local TTS.

Goal:
Build a robust installer and registry system for Sherpa-ONNX TTS models inside the Expo app.

The app must be able to:
- Download a model archive from a URL
- Store it in app storage
- Extract it safely
- Validate required files
- Build a normalized TtsModelConfig
- Register the installed model locally
- Initialize the native module with that config
- List installed models
- Remove installed models cleanly

Files to create or update:
- src/lib/tts/model-installer.ts
- src/lib/tts/model-registry.ts
- src/lib/tts/file-layout.ts
- src/lib/tts/model-validation.ts
- src/lib/tts/path-utils.ts
- src/lib/tts/catalog.ts
- docs/model-installation-flow.md

Expected features:
- Deterministic storage layout under a root tts directory
- Per-model folder naming that is stable and safe
- Registry persistence in JSON or another lightweight local store
- Validation per family
- Download status and install status handling
- Friendly typed errors for corrupt archives, missing files, duplicate installs, and unsupported families

Storage layout target:
<FileSystem documents or app support>/tts/
  registry.json
  piper/
  kokoro/
  vits/
  matcha/
  cache/

Rules:
- No hard-coded paths outside a single path utility layer
- Build family-specific config from discovered files, not from guesswork in the UI layer
- Make install idempotent where reasonable
- If extraction requires a library, wire it in cleanly and document it
- Add checksum hook points even if checksum data is optional for now

Also generate:
- A small local catalog example with two or three voice entries
- A sample install function the UI can call
- Clear uninstall behavior that removes files and updates registry atomically as much as possible

Return complete code and a short explanation of the install flow.
```

---

## Prompt 5 - Implement chunking, caching, playback queue, and fallback behavior

Use this after installation is working.

```text
Now implement the runtime reading pipeline for long-form local TTS.

Goal:
Given long text that arrives from one of three sources — pasted text, a URL
(article body extracted from the page), or a local file (plain text or PDF) —
the app should split the text into chunks, synthesize each chunk to a cached
audio file, and play the files in sequence using expo-audio.

Playback engine requirement:
- Use expo-audio as the ONLY audio playback engine
- Do NOT use expo-av or react-native-track-player for TTS playback
- expo-audio provides AudioPlayer, useAudioPlayer(), useAudioPlayerStatus(),
  and AudioSession for lock-screen / notification media controls on iOS

Features to implement:
- Text chunker with configurable chunk size and sentence-aware boundaries
- Chunk metadata type
- Synthesis queue service (synthesizes chunks ahead of playback)
- Cache key generation based on model + text + speaker options
- Reuse cached audio files if already synthesized
- Sequential playback of synthesized WAV files via expo-audio AudioPlayer
- Basic pause / resume / stop / skip-chunk behavior
- Lock-screen and notification playback controls via AudioSession (iOS) and
  the notification player options (Android) provided by expo-audio
- Progress tracking via useAudioPlayerStatus() from expo-audio
- Fallback to system TTS if local synthesis fails on a chunk

expo-audio integration requirements:
- Configure AudioSession once at app startup:
    await AudioSession.setAudioModeAsync({
      playsInSilentMode: true,
      shouldDuckAndroid: true,
    })
- Create a single shared AudioPlayer instance in the pipeline service using
  useAudioPlayer() — do not create new player instances per chunk
- Load each synthesized WAV file into the player with player.replace(source)
  before calling player.play()
- Manage the playback queue manually in the pipeline service:
    - Keep an ordered list of pending WAV file paths
    - On player status update (didJustFinish), load and play the next file
- Expose player and status to the UI via:
    useAudioPlayer() and useAudioPlayerStatus() from expo-audio
- never build a parallel audio state machine — read state from
  useAudioPlayerStatus() only
- When the pipeline is stopped or reset, call player.pause() then
  player.remove() to release the player

Files to create or update:
- src/lib/tts/chunker.ts
- src/lib/tts/cache.ts
- src/lib/tts/queue.ts           — synthesis queue (ordered pending chunks)
- src/lib/tts/pipeline.ts        — orchestrates synthesis + expo-audio playback
- src/lib/tts/audioSession.ts    — AudioSession initialization helper
- src/lib/tts/fallback.ts
- src/lib/text/paste-input.ts    — normalizes raw pasted or typed text
- src/lib/text/url-extractor.ts  — fetches a URL and extracts readable article body via @mozilla/readability
- src/lib/text/file-extractor.ts — uses expo-document-picker and expo-file-system to read .txt; placeholder hook for PDF extraction
- src/lib/text/index.ts          — re-exports all text input helpers
- src/features/tts/useLocalTtsReader.ts   — hook exposing pipeline controls
- src/features/tts/ReaderDemoScreen.tsx   — three-mode tabbed demo screen
- docs/local-tts-runtime-pipeline.md

Rules:
- Preserve paragraph boundaries when practical
- Avoid one giant synthesis call for an entire article
- Make chunking deterministic
- Keep cache keys stable
- Separate concerns clearly: chunking, synthesis, cache lookup, audio session,
  sequential playback, fallback
- Add logging hooks for diagnostics
- Return typed results instead of loose objects
- Do not duplicate expo-audio state — read it from useAudioPlayerStatus(),
  never mirror it in zustand unless needed for UI-only transient state

Desired flow:
1. Input text arrives
2. Text is normalized
3. Text is chunked
4. Pipeline starts: for each chunk, check cache then synthesize to WAV file
5. As the first WAV file is ready, load it into the AudioPlayer and call play()
6. On didJustFinish, the pipeline loads the next cached/synthesized WAV file
7. Synthesis continues ahead of playback for remaining chunks
8. If a chunk fails locally, route that chunk to fallback TTS when enabled
9. AudioSession keeps lock-screen and notification controls active

Also implement:
- A demo UI screen with three tabs or input modes:
  - Paste — a multi-line text area where the user types or pastes text
  - URL — a text input for a URL; tapping "Load" fetches and extracts the readable body
  - File — a button that opens expo-document-picker; selected .txt or .pdf content is extracted and loaded into the pipeline
- Progress indicator using useAudioPlayerStatus() (currentTime + duration)
- Play/pause/stop buttons that call through the pipeline service, not directly
  on the AudioPlayer instance

Return the full code for all files and explain the pipeline briefly.
```

---

## Prompt 6 - QA, hardening, cleanup, and developer docs

Use this near the end.

```text
Now act as a principal engineer doing a production hardening pass.

Your job:
- Inspect all generated code paths for correctness, duplication, missing imports, inconsistent naming, and incomplete wiring
- Fix type issues
- Fix path handling mistakes
- Remove dead code
- Add missing docs
- Add a final setup guide so another engineer can run the project

Tasks:
1. Audit the file tree and identify broken links between modules.
2. Ensure TypeScript exports are clean and consistent.
3. Ensure native module names match on JS, iOS, and Android.
4. Ensure the model installer and runtime pipeline integrate with the native bridge.
5. Add missing README-style documentation.
6. Add a troubleshooting section for common native and model errors.
7. Add TODO markers only where truly necessary.
8. Produce a final acceptance checklist and status summary.

Files to create or update:
- README.md
- docs/setup-local-tts.md
- docs/troubleshooting-local-tts.md
- docs/acceptance-checklist.md
- any broken source files that need cleanup

Important:
- Do not rewrite the whole repo if only targeted fixes are needed.
- Keep changes surgical and high value.
- Prefer concrete fixes over long explanations.
- At the end, list anything that still requires manual work on a real machine, such as native package linking, CocoaPods install, or Android Gradle sync.

Return:
- Files changed
- Final code diffs or full updated files
- Final run steps
- Remaining manual steps
```

---

## Optional Prompt 7 - Generate tests and validation harnesses

Use this if your agent is good at tests.

```text
Now generate tests and validation utilities for the local TTS project.

Create:
- unit tests for chunker, cache key generation, model validation, and registry operations
- integration-style test helpers for the TypeScript service layer
- lightweight native test stubs if the repository supports them
- a diagnostics utility that can print engine status, installed models, and missing required files

Files to add or update:
- src/lib/tts/__tests__/chunker.test.ts
- src/lib/tts/__tests__/cache.test.ts
- src/lib/tts/__tests__/model-validation.test.ts
- src/lib/tts/__tests__/model-registry.test.ts
- src/lib/tts/diagnostics.ts
- docs/testing-local-tts.md

Rules:
- Focus on deterministic logic first
- Mock native module boundaries where necessary
- Keep tests readable and low-maintenance
- Avoid brittle snapshot-heavy tests

Return full code for all new files.
```

---

## Prompt 8 - Design system tokens and theming

Use this after Prompt 2. Run before building any feature screens.

```text
You are a Senior Frontend Architect & Design Systems Engineer working on a React
Native / Expo app called AloudReader.

Your job is to refactor the app so that ALL visual styling (colors, typography,
spacing, radii, shadows, motion, z-index) is controlled via a typed design token
layer. No hard-coded visual values may exist in components or feature code.

This app uses Expo Router and React Native `StyleSheet`. CSS variables are not
available in React Native. Instead, implement tokens as TypeScript constants and
consume them via a `useThemeColors()` hook that returns resolved HSL color
strings from the active light/dark token set.

---

Non-negotiable rules:
- No hex, rgb, or hsl literals in TSX/TS component files
- No hard-coded px values (use spacing token constants)
- No inline style objects for visual properties unless there is no other option
- Raw values are allowed ONLY inside token files under src/styles/tokens/
- Dark mode is resolved by `useThemeColors()` which reads the theme store and
  returns the correct token set — no root class needed
- Components consume semantic color values via `useThemeColors()` only:
  - `{ color: colors.foreground, backgroundColor: colors.background }` ✅
  - `{ color: '#7c3aed' }` ❌

---

Required target structure:
```

src/ styles/ tokens/ colors.ts typography.ts spacing.ts radii.ts shadows.ts
motion.ts z-index.ts index.ts # re-exports all token maps themes/ default.ts
dark.ts theme/ theme.ts # setMode(), setTheme(), persistence helpers
ThemeProvider.tsx # wraps app in a View with background color from tokens
useThemeColors.ts # hook returning resolved color strings for the active theme

```
Token layer specification:

A) Colors (semantic HSL triplets)
  --background, --foreground, --surface, --surface-foreground
  --muted, --muted-foreground, --border, --input, --ring
  --primary, --primary-foreground
  --secondary, --secondary-foreground
  --accent, --accent-foreground
  --destructive, --destructive-foreground
  --success, --warning, --info

B) Typography
  fontSans, fontMono, text-xs through text-2xl, leading-*, font-weight-*

C) Spacing — 8-pt scale from space-0 to space-12+

D) Radii — radius-sm, radius-md, radius-lg, radius-xl, radius-full

E) Shadows — shadow-sm, shadow-md, shadow-lg

F) Motion — duration-fast, duration-normal, duration-slow, ease-standard

G) Z-index — z-dropdown, z-sticky, z-modal, z-toast, z-tooltip

StyleSheet token requirements:
- All semantic colors exported from src/styles/tokens/colors.ts as HSL triplet strings
- borderRadius, spacing, fontSize, lineHeight constants exported from their
  respective token files

Component rules:
- Refactor at minimum: Button, Card, Input to use semantic tokens via useThemeColors()
- If a component needs a specific value not in tokens, create the token first

Guardrails:
- Add ESLint rule blocking hex/rgb/hsl literals in TS/TSX files

Deliverables:
1. All token files under src/styles/tokens/
2. src/theme/useThemeColors.ts hook
3. src/theme/theme.ts and ThemeProvider.tsx
4. Refactored Button, Card, Input components
5. ESLint config additions
6. docs/design-system-tokens.md explaining how to add a new brand theme

App context:
- App name: AloudReader — a long-form reading and listening app
- Brand primary: reader-focused calm palette (blues, warm neutrals — pick
  sensible defaults)
- Support light and dark mode from day one
- Do not leave TODOs; if a detail is undecidable, pick a safe default and
  document it
```

---

## Prompt 9 - Supabase data access SDK

Use this after Prompt 2. Can run in parallel with Prompt 8.

```text
You are a Senior Full-Stack Architect specializing in Supabase and TypeScript.

Refactor the AloudReader codebase into a clean data access SDK so the UI and
feature layers never import Supabase directly, never call supabase.from() or
supabase.rpc(), and never contain hard-coded table, view, or RPC name strings.

---

Non-negotiable rules:
1. No Supabase usage outside src/data/**
2. No hard-coded table/view/rpc name strings except in src/data/supabase/names.ts
3. No hard-coded .select("...") strings outside src/data/selects/**
4. All RPC calls must be via typed wrappers with Zod validation on args and result
5. UI imports only from src/data/index.ts

---

Required target structure:
```

src/ data/ index.ts supabase/ client.ts db.types.ts # generated types or
placeholder names.ts # TABLE / VIEW / RPC constants selects/
<domain>.select.ts codecs/
<domain>.codec.ts # Zod schemas + DTO types errors.ts queries/
<domain>.query.ts # query specs + appliers rpc/ index.ts
<domain>.rpc.ts repos/
<domain>.repo.ts

```
Domains for AloudReader (adapt if schema differs):
- documents    — user-uploaded or imported text content (PDF, article, note)
- bookmarks    — saved positions within a document
- readingHistory — per-document playback progress and last-read timestamp
- profiles     — user account info, preferences, selected TTS voice
- search       — full-text or vector search over the document catalog

Implementation steps:

1. Create src/data/supabase/client.ts using EXPO_PUBLIC_SUPABASE_URL and
   EXPO_PUBLIC_SUPABASE_ANON_KEY from environment variables. Use the Database
   generic type from db.types.ts.

2. Create src/data/supabase/names.ts with TABLE, VIEW, and RPC constants for all
   domains above.

3. Create per-domain select files:
   - card shape for list views
   - detail shape for document/reader screens
   - row shape for single-record fetches

4. Create Zod codecs per domain. Each codec:
   - validates every repository return value
   - maps server shape to an app DTO
   - exports inferred TypeScript types

5. Create query spec + applier per domain where filtering applies (e.g.
   DocumentListSpec with q, type, language, sort).

6. Wrap any RPC calls in typed wrappers with Zod arg validation and result
   validation.

7. Create repositories exposing stable operations:
   - documents:    list, detail, create, delete
   - bookmarks:    list by document, upsert, delete
   - readingHistory: get, upsert (via RPC if available)
   - profiles:     get current user profile, update preferences
   - search:       full-text or simple query

8. Create src/data/index.ts exporting all repo methods and DTO types. UI imports
   only from here.

9. Add ESLint rule blocking @supabase/supabase-js imports outside src/data/**.
   Add CI grep check for .from( and .rpc( usage in src/features and
   src/components.

Migration requirement:
- Find all direct Supabase calls in existing UI/feature code
- Replace with repository calls
- Delete duplicate query fragments

Deliverables:
1. All files under src/data/**
2. Updated ESLint config
3. Two migration examples: a list screen/hook and a write flow (progress upsert
   or equivalent)
4. docs/data-access-sdk.md explaining how to add a new query, add a new select
   shape, and rename an RPC safely

Environment variables used:
- EXPO_PUBLIC_SUPABASE_URL
- EXPO_PUBLIC_SUPABASE_ANON_KEY

Do not invent a Supabase project URL or key. Use the env var references only.
```

---

## Prompt 10 - Multi-language support and i18n

Use this after Prompt 2 and before building any feature screens.

```text
You are a Senior Frontend Architect specializing in React Native internationalisation.

Your job is to implement a production-ready i18n layer for AloudReader so that
the entire UI is translatable, no user-visible text is ever hard-coded in
components or screens, and every translation key has a guaranteed English
fallback.

---

Library choice:
- Use i18next and react-i18next (standard for React Native / Expo)
- Use expo-localization to detect the device locale at runtime
- Use i18next-resources-to-backend or direct JSON imports for locale loading
- Use TypeScript declaration merging or codegen to make t() fully type-safe

---

Non-negotiable rules:
1. No bare string literals in JSX — <Text>Hello</Text> is forbidden
   Use <Text>{t('home.title')}</Text> instead
2. No string literals passed as label/title/placeholder props in components
   Use t('key') at the call site
3. Every key that appears in any locale file must also exist in en-US with a
   non-empty value — en-US is the mandatory fallback
4. If a translation is missing in any non-English locale, i18next must silently
   fall back to the en-US value, never crash or render an empty string
5. Translation keys must be type-checked — typos in t('wrnog.key') must be a
   TypeScript compile error

---

Required target structure:
```

src/ i18n/ index.ts # configures i18next, detects locale, exports i18n hooks.ts

# re-exports useTranslation typed to your key schema types.ts # TypeScript

augmentation for i18next DefaultResources locales/ en-US/ translation.json #
source of truth — all keys + English values fr-FR/ translation.json # initial
French translations es-ES/ translation.json # initial Spanish translations ar/
translation.json # Arabic (RTL) — include RTL layout note

```
---

Translation key conventions:
- Use dot-namespaced keys grouped by screen or feature:
  - common.*        — shared labels (save, cancel, loading, error, retry)
  - navigation.*    — tab and screen titles
  - home.*          — home screen copy
  - reader.*        — reading/playback screen copy
  - tts.*           — TTS model UI (install, downloading, ready, error states)
  - settings.*      — settings screen copy
  - auth.*          — sign in / sign up / profile copy
  - errors.*        — user-facing error messages
- Keys must be snake_case within their namespace
- Never use numeric indexes as key names

---

Configuration requirements for src/i18n/index.ts:
- Detect locale from expo-localization (Localization.locale)
- Map detected locale to the nearest supported locale or fall back to en-US
- Set fallbackLng: 'en-US'
- Set interpolation: { escapeValue: false } (React Native renders safely)
- Do not use any remote loader at init time — all translation files are bundled
- Export the configured i18n instance and a getSupportedLocales() helper

---

TypeScript type safety:
- Add src/i18n/types.ts that uses declare module 'i18next' to set
  DefaultResources to the en-US translation JSON structure
- This makes t('any.key') resolve against the en-US type at compile time
- Add a CI script that validates every key in non-English locale files exists
  in en-US (no orphan keys in translations)

---

Component rules:
- Create a thin useTranslation re-export in src/i18n/hooks.ts typed to your
  resource schema so components never import directly from react-i18next
- Refactor at minimum: a nav screen title, a Button label, and an error message
  to demonstrate the pattern
- For RTL locales (Arabic), add a note in docs about wrapping layout with
  I18nManager.forceRTL() or equivalent

---

Guardrails:
- Add ESLint rule (or custom lint script) that detects bare string literals
  inside JSX Text elements and JSX props that expect display text
- The rule should allow non-display strings (testID, accessibilityLabel, etc.)
- Document how to add a new locale in docs/adding-a-locale.md

---

Deliverables:
1. src/i18n/index.ts — i18next configuration
2. src/i18n/hooks.ts — typed useTranslation re-export
3. src/i18n/types.ts — TypeScript i18next module augmentation
4. src/i18n/locales/en-US/translation.json — complete source-of-truth file
   covering all namespaces listed above with sensible English values
5. src/i18n/locales/fr-FR/translation.json — French translation stub
6. src/i18n/locales/es-ES/translation.json — Spanish translation stub
7. src/i18n/locales/ar/translation.json — Arabic translation stub + RTL note
8. ESLint config addition blocking hard-coded JSX text
9. CI script validating all locales contain every en-US key
10. docs/adding-a-locale.md — step-by-step guide for adding a new language
11. Short migration example showing a screen before and after i18n refactor

App name for UI strings: AloudReader
Default language: en-US
Fallback language: en-US

Do not invent locale content you are not confident about. Use placeholder
translations in non-English files where needed and mark them with a comment.
```

---

## Prompt 11 - Text input sources (paste, URL, file)

Use this after Prompt 5. Implement the three text input modes so users can
listen to any text.

````text
Now implement the text input layer for AloudReader so users can listen to text
from three sources: pasted/typed text, a URL, and a local file.

---

Goal:
Build a clean text-source abstraction under src/lib/text/ that normalizes
content from three origins into a single plain string that the pipeline
(src/lib/tts/pipeline.ts) can accept. Then connect these sources to the
ReaderDemoScreen.

---

Text source definitions:

1. Paste / Typed text
   - The user types or pastes text directly into a multi-line TextInput
   - No extraction needed — normalize whitespace and pass to the pipeline
   - File: src/lib/text/paste-input.ts

2. URL
   - The user enters a URL
   - The app fetches the raw HTML with the Fetch API (no CORS issues on native)
   - Extracts the readable article body using @mozilla/readability and a JSDOM
     shim compatible with React Native (use @nozbe/watermelondb/utils/common/domParser
     or a minimal custom DOMParser shim — document which approach is used)
   - Strip residual HTML tags before passing text to the pipeline
   - File: src/lib/text/url-extractor.ts
   - Export: extractTextFromUrl(url: string): Promise<UrlExtractResult>
   - UrlExtractResult: { title: string; text: string; url: string }

3. Local file
   - The user taps a button that opens expo-document-picker
   - Supported types: text/plain (.txt), application/pdf (.pdf)
   - For .txt: read with expo-file-system FileSystem.readAsStringAsync()
   - For .pdf: use expo-file-system to get the file URI; if a native PDF-to-text
     solution is not available, write a clearly marked TODO and provide a typed
     stub that the native module can fill later
   - File: src/lib/text/file-extractor.ts
   - Export: extractTextFromFile(): Promise<FileExtractResult>
   - FileExtractResult: { filename: string; text: string; mimeType: string }

---

Shared contract:
- All three extractors return a normalized { text: string } that can be passed
  to the pipeline without further transformation
- Create src/lib/text/index.ts that re-exports all extractors and shared types
- Create src/lib/text/types.ts for TextSourceType, TextSource, and extraction result types:

```ts
export type TextSourceType = 'paste' | 'url' | 'file';

export interface TextSource {
  type: TextSourceType;
  text: string;
  label?: string; // title or filename for display
}
````

---

UI requirements:

- Update src/features/tts/ReaderDemoScreen.tsx to present three tabs or
  segmented controls:
  - "Paste" tab: multi-line TextInput + "Listen" button
  - "URL" tab: single-line TextInput for URL + "Load & Listen" button; show
    loading spinner while fetching
  - "File" tab: "Pick File" button; show selected filename once picked; "Listen"
    button activates pipeline
- All three tabs feed into the same useLocalTtsReader() hook and pipeline
- Show a brief error message (via i18n key) if extraction fails
- After text is loaded from URL or file, display a short preview of the first
  ~200 characters so the user can confirm before pressing Listen
- All display strings must go through the i18n t() hook (add keys under
  reader.*)

---

Dependencies to add:

- @mozilla/readability — article extraction from HTML
- A JSDOM / DOMParser shim compatible with React Native (document the chosen
  option clearly)
- expo-document-picker — file picker (may already be installed; check before
  adding)
- expo-file-system — file reading (may already be installed; check before
  adding)

---

Rules:

- Keep the text extraction layer independent of TTS concerns — it only produces
  strings
- All extraction functions must be async and return a typed result or throw a
  typed TextExtractionError
- Add error types in src/lib/text/errors.ts matching the pattern in
  src/lib/tts/errors.ts
- Do not block the UI thread during extraction
- For URL fetching, add a timeout (default 10 seconds) and expose it as a
  parameter
- Mark PDF text extraction as TODO with a typed stub placeholder
- Ensure all new i18n keys are added to src/i18n/locales/en-US/translation.json

---

Files to create or update:

- src/lib/text/types.ts
- src/lib/text/errors.ts
- src/lib/text/paste-input.ts
- src/lib/text/url-extractor.ts
- src/lib/text/file-extractor.ts
- src/lib/text/index.ts
- src/features/tts/ReaderDemoScreen.tsx — update to three-mode tabbed layout
- src/i18n/locales/en-US/translation.json — add reader.paste_tab,
  reader.url_tab, reader.file_tab, reader.load_button, reader.listen_button,
  reader.pick_file_button, reader.text_preview_label, reader.url_load_error,
  reader.file_load_error, reader.file_picked_label

---

Return full code for all files and a brief explanation of the extraction flow
for each source type. Include one code example per extractor showing a call
site.

````
---

## Prompt 12 - Screen scaffolding and navigation map

Use this after Prompt 2. Run before building any feature screens.

```text
Now scaffold the complete Expo Router navigation tree for AloudReader.

Goal:
Create all screen files and the Expo Router layout hierarchy so that every
route in the app is reachable, the tab bar is visible on main screens, auth
screens are isolated, and the Reader stack is pushed full-screen.

---

Navigation structure to implement:

1. Root layout — app/_layout.tsx
   - Wrap the entire app in ThemeProvider and i18n initialization
   - Call AudioSession.setAudioModeAsync once here
   - Redirect unauthenticated users to (auth)/sign-in using Supabase session state
   - Otherwise render the (tabs) navigator

2. Auth group — app/(auth)/_layout.tsx
   Routes:
   - welcome.tsx        — onboarding carousel (shown only on first launch; persist a flag)
   - sign-in.tsx        — email + password, magic link option
   - sign-up.tsx        — account creation
   - forgot-password.tsx — reset email trigger
   Rules:
   - Auth screens must NOT show the tab bar
   - After successful sign-in, redirect to (tabs)/index
   - After sign-up, redirect to (auth)/welcome

3. Tab bar — app/(tabs)/_layout.tsx
   Tabs (in order): Library → Listen → Search → Settings
   - Listen tab must be visually prominent (accent tint or larger icon)
   - All tab labels must use t() from the i18n layer
   - Render MiniPlayerBar above the tab bar when a TTS session is active;
     implement it as an overlay component in the tab layout, not inside
     individual screens

4. Library tab — app/(tabs)/index.tsx
   - FlatList of saved documents from the documents repo
   - Each card: title, source type badge (paste/url/file), last-read timestamp,
     progress indicator
   - Empty state with a CTA that navigates to the Listen tab
   - Tapping a card pushes (library)/[id]
   - Tapping "Resume" launches (reader)/[id]

5. Listen tab — app/(tabs)/listen.tsx
   - Three-tab segmented control: Paste | URL | File
   - Each mode calls the corresponding extractor from src/lib/text/
   - After extraction show a ~200-char preview; user taps "Listen" to start
   - Listening triggers the pipeline and activates the MiniPlayerBar
   - Optionally prompt the user to save the content as a document

6. Search tab — app/(tabs)/search.tsx
   - Debounced search input
   - Results list using the search repo
   - Tapping a result pushes (library)/[id]

7. Settings root — app/(tabs)/settings.tsx
   - Navigation list: Voices, Profile, Appearance, Language, Playback, About
   - Show active voice name and locale as subtitles

8. Reader — app/(reader)/[id].tsx
   - Full-screen layout pushed from Library or Listen
   - UI: document title, large play/pause button, progress bar,
     previous-chunk / next-chunk skip, speed control (0.75× 1× 1.25× 1.5× 2×),
     bookmarks sheet trigger
   - All controls delegate to the pipeline service — never touch AudioPlayer
     directly from the screen
   - Bookmarks rendered in a bottom sheet (use @gorhom/bottom-sheet or a simple
     animated View; document the choice)

9. Document Detail — app/(library)/[id].tsx
   - Title, source type, character count, created date, reading history
   - "Start listening" → push (reader)/[id]; Delete with confirmation

10. Reading History — app/(library)/history.tsx
    - Chronological list of all documents with last-session timestamp
    - Resume button on each entry

11. Settings sub-screens — app/(settings)/
    - voices/index.tsx     — VoiceCatalogScreen: grouped by language/family,
                             installed badge, storage usage display
    - voices/[modelId].tsx — VoiceDetailScreen: short sample synthesis preview,
                             download progress bar, install / uninstall action
    - profile.tsx
    - appearance.tsx       — light / dark / system toggle
    - language.tsx         — locale picker (en-US, fr-FR, es-ES, ar)
    - playback.tsx         — speed default, chunk size, fallback TTS toggle
    - about.tsx            — version, licenses, support link

---

Persistent UI components:

- src/components/ui/MiniPlayerBar.tsx
  Rendered in (tabs)/_layout.tsx. Visible when useLocalTtsReader() reports an
  active session. Shows document title, progress indicator, play/pause button.
  Tapping navigates to the active (reader)/[id].

- src/components/ui/OfflineBanner.tsx
  Rendered in app/_layout.tsx. Shown when the device has no network connection.
  Offline TTS playback must still work when this banner is visible.

- src/components/ui/DownloadToast.tsx
  Rendered in app/_layout.tsx. Non-blocking overlay shown during model or
  document downloads.

---

Implementation rules:
- Generate real screen files with a wired-up skeleton, not placeholder text
- Use the i18n t() hook for every visible string
- Use useThemeColors() for every style value — no inline hex or px literals
- Import data only from src/data/index.ts
- Keep screen components under 200 lines at scaffold stage; extract
  sub-components to src/components/ as needed
- No business logic in screen files — delegate to hooks and service layer

---

Files to create or update:
- app/_layout.tsx
- app/(auth)/_layout.tsx
- app/(auth)/welcome.tsx
- app/(auth)/sign-in.tsx
- app/(auth)/sign-up.tsx
- app/(auth)/forgot-password.tsx
- app/(tabs)/_layout.tsx
- app/(tabs)/index.tsx
- app/(tabs)/listen.tsx
- app/(tabs)/search.tsx
- app/(tabs)/settings.tsx
- app/(reader)/_layout.tsx
- app/(reader)/[id].tsx
- app/(library)/[id].tsx
- app/(library)/history.tsx
- app/(settings)/voices/index.tsx
- app/(settings)/voices/[modelId].tsx
- app/(settings)/profile.tsx
- app/(settings)/appearance.tsx
- app/(settings)/language.tsx
- app/(settings)/playback.tsx
- app/(settings)/about.tsx
- src/components/ui/MiniPlayerBar.tsx
- src/components/ui/OfflineBanner.tsx
- src/components/ui/DownloadToast.tsx
- src/i18n/locales/en-US/translation.json — add navigation.* keys and any new
  screen namespace keys

Return full code for all files.
```

---

## One-shot prompt

Use this only if your agent is reliable with large codegen tasks.

```text
You are a staff-level mobile platform engineer. Generate a production-ready Expo / React Native project that implements fully local TTS using Sherpa-ONNX.

Project identity — use these exact values throughout, do not invent alternatives:
- App name: AloudReader
- iOS bundle ID: com.ai-orbit-studio.aloudreader
- Android package name: com.aiorbitstudio.aloudreader
- Expo SDK: latest stable (scaffold with npx create-expo-app@latest --template default@sdk-55)
- Navigation: Expo Router
- State management: zustand
- Default language: en-US
- Initial TTS model family: piper
- Initial TTS model ID: en-us-amy
- Model catalog: local seed file at src/lib/tts/catalog.ts (no remote URL)
- Fallback to system TTS: enabled
- Audio output format: wav

Requirements:
- Expo app with TypeScript
- Development build, not Expo Go
- Local Expo native module inside modules/expo-local-tts
- Native wrappers in Swift and Kotlin
- Support Sherpa-ONNX TTS families: Piper, Kokoro, VITS, Matcha
- JS API methods: initialize, preloadModels, synthesizeToFile, speak, stop, isReady, listInstalledModels, uninstallModel, getEngineStatus
- Model download, extraction, validation, registry, uninstall
- Deterministic storage layout under app storage
- Text chunking, cache, synthesis queue, playback queue
- expo-audio as the audio playback engine with lock-screen controls via AudioSession
- Fallback to system TTS on failure
- Demo UI screen with three text input modes:
  - Paste — multi-line text input
  - URL — fetch and extract readable article body with @mozilla/readability
  - File — pick a .txt or .pdf file via expo-document-picker and extract its text
- Documentation and setup instructions

Constraints:
- No Expo Go dependency for the final native TTS feature
- No hard-coded paths in UI code
- Keep JS layer family-agnostic
- Isolate model-family-specific mapping in native helpers
- Start with synthesize-to-file and playback from generated files
- Produce real code and file contents, not only summaries
- Keep code maintainable and consistent across the repo

Execution rules:
1. First inspect the repository and infer the current structure.
2. Then generate the implementation in phases.
3. Show the exact files created or modified.
4. For every major file, output the full file content.
5. If some native wiring requires manual follow-up, mark it clearly with TODO comments and docs.
6. Include setup docs and troubleshooting docs.
7. Do not leave the repository half-finished if you can continue with reasonable assumptions.

Final output must include:
- architecture summary
- final folder tree
- all source files
- docs
- setup steps
- acceptance checklist
- remaining manual steps
````

---

## Agent operating mode prompt

Use this as a short preface before any of the prompts above if your LLM agent
benefits from strict behavior guidance.

```text
Operate like a careful software engineer working in an existing repository.

Project identity — use these values everywhere, never invent alternatives:
- App name: AloudReader
- iOS bundle ID: com.ai-orbit-studio.aloudreader
- Android package name: com.aiorbitstudio.aloudreader
- Expo SDK: latest stable (scaffold with npx create-expo-app@latest --template default@sdk-55)
- Default language: en-US
- Initial TTS model family: piper
- Initial TTS model ID: en-us-amy
- Model catalog: local seed file at src/lib/tts/catalog.ts (no remote URL)
- Fallback to system TTS: enabled
- Audio output format: wav
- Navigation: Expo Router
- State management: zustand
- Audio playback engine: expo-audio — do NOT use expo-av or react-native-track-player
- Supabase URL: env var EXPO_PUBLIC_SUPABASE_URL (do not invent a value)
- Supabase anon key: env var EXPO_PUBLIC_SUPABASE_ANON_KEY (do not invent a value)

Navigation rules:
- Use Expo Router file-based routing exclusively — no programmatic router config
- Route groups: (auth), (tabs), (reader), (library), (settings)
- Tab order: Library → Listen → Search → Settings
- Listen tab is the primary creation surface — give it visual prominence (accent tint)
- Auth screens must never show the tab bar
- The MiniPlayerBar component renders above the tab bar in (tabs)/_layout.tsx,
  visible only when a TTS session is active
- Auth redirect is handled in app/_layout.tsx using the Supabase session state
- All screen labels and tab names must use the t() i18n hook
- Screen files must stay under 200 lines at scaffold stage; extract sub-components
  to src/components/ as needed
- No business logic in screen files — delegate to hooks and the service layer

Audio playback rules:
- Use expo-audio as the ONLY audio playback engine
- Never use expo-av or react-native-track-player for TTS playback
- Configure AudioSession once at app startup with playsInSilentMode: true
- Use a single shared AudioPlayer instance across the pipeline service
- Load each WAV file with player.replace(source) before calling player.play()
- Manage the playback queue manually — on didJustFinish, load the next file
- Read playback state from useAudioPlayerStatus() only; do not mirror it in zustand
- Call player.pause() then player.remove() when the session is stopped or reset
- Lock-screen / notification controls are enabled via AudioSession configuration

i18n rules:
- No hard-coded user-visible text strings in TSX/TS component or screen files
- All UI text must use the t() hook from the i18n layer
- Every translation key must have a fallback English value in
  src/i18n/locales/en-US/translation.json
- Translation key types must be generated or declared so t() is type-safe
- ESLint rule must block bare string literals inside JSX Text elements

Design system rules:
- No hex, rgb, or hsl literals in TSX/TS component files
- No hard-coded px values in components — use spacing token constants
- All raw values live only in src/styles/tokens/**
- Components consume colors via useThemeColors(): colors.background, colors.foreground, colors.primary
- Dark mode supported from day one via ThemeProvider + useThemeColors()

Data access rules:
- No Supabase imports outside src/data/**
- No hard-coded table, view, or RPC name strings outside src/data/supabase/names.ts
- No .select("...") strings outside src/data/selects/**
- UI imports data only from src/data/index.ts

Text input rules:
- Users can listen to text from three sources: paste, URL, and file
- Text extraction lives under src/lib/text/ and is independent of TTS concerns
- URL extraction uses @mozilla/readability + a compatible DOMParser shim
- File extraction uses expo-document-picker + expo-file-system for .txt; PDF is a typed stub TODO
- All extractors return a { text: string } normalized result
- All three input modes connect to the same pipeline via useLocalTtsReader()
- No raw HTML or binary content may be passed to the TTS pipeline — always extract plain text first

General engineering rules:
- Inspect before editing.
- Prefer updating existing files over duplicating logic.
- Keep changes coherent with the repository style.
- Use TypeScript for app code, Swift for iOS native code, Kotlin for Android native code.
- Avoid hard-coded strings and paths when a typed abstraction should exist.
- If a task is large, break it into phases but keep delivering code.
- If you are uncertain, make the safest reasonable assumption and continue.
- Never claim a feature is implemented unless the code path is actually present.
- When done, list files changed and remaining manual steps.
```

---

## Project constants

These values are already resolved. They are injected directly into the Agent
operating mode prompt, Prompt 1, Prompt 2, and the One-shot prompt. Update them
here and in each relevant prompt block if anything changes.

### Core app identity

- `APP_NAME`: AloudReader
- `BUNDLE_ID_IOS`: com.ai-orbit-studio.aloudreader
- `PACKAGE_NAME_ANDROID`: com.aiorbitstudio.aloudreader
- `DEFAULT_LANGUAGE`: en-US
- `EXPO_SDK`: latest stable — scaffold with
  `npx create-expo-app@latest --template default@sdk-55`
- `USE_EXPO_ROUTER`: true
- `STATE_LIBRARY`: zustand

### TTS engine

- `INITIAL_MODEL_FAMILY`: piper
- `INITIAL_MODEL_ID`: en-us-amy
- `MODEL_CATALOG_URL`: local seed file at `src/lib/tts/catalog.ts` (no remote
  URL)
- `ALLOW_FALLBACK_SYSTEM_TTS`: true
- `AUDIO_OUTPUT_FORMAT`: wav

### Audio playback

- `AUDIO_PLAYER_LIBRARY`: expo-audio
- `AUDIO_SESSION_FILE`: `src/lib/tts/audioSession.ts`
- `AUDIO_SESSION_SETUP_LOCATION`: root layout or app entry point
- `FORBIDDEN_AUDIO_APIS`: expo-av, react-native-track-player
- `LOCK_SCREEN_CONTROLS`: enabled via AudioSession (playsInSilentMode +
  notification options)

### Supabase backend

- `SUPABASE_URL`: read from `EXPO_PUBLIC_SUPABASE_URL` env var at runtime
- `SUPABASE_ANON_KEY`: read from `EXPO_PUBLIC_SUPABASE_ANON_KEY` env var at
  runtime
- `SUPABASE_DOMAINS`: documents, bookmarks, readingHistory, profiles, search

### Design system

- `DESIGN_TOKEN_DIR`: `src/styles/tokens/`
- `THEME_PROVIDER`: `src/theme/ThemeProvider.tsx`
- `DARK_MODE_STRATEGY`: theme store resolved via useThemeColors() hook
- `STYLING_LIBRARY`: React Native StyleSheet + useThemeColors hook

### i18n

- `I18N_LIBRARY`: i18next + react-i18next + expo-localization
- `I18N_DIR`: `src/i18n/`
- `DEFAULT_LOCALE`: en-US (source of truth — all keys must exist here)
- `FALLBACK_LOCALE`: en-US
- `SUPPORTED_LOCALES`: en-US, fr-FR, es-ES, ar
- `I18N_KEY_NAMESPACES`: common, navigation, home, reader, tts, settings, auth,
  errors
- `RTL_LOCALE_SUPPORT`: ar (Arabic) — layout must respect RTL
- `NO_HARDCODED_TEXT`: enforced — ESLint blocks bare string literals in JSX

### Navigation and screens

- `NAV_LIBRARY`: Expo Router (file-based, no programmatic config)
- `ROUTE_GROUPS`: (auth), (tabs), (reader), (library), (settings)
- `TAB_ORDER`: Library, Listen, Search, Settings
- `PRIMARY_TAB`: Listen — visually prominent, always one tap away
- `AUTH_SCREENS`: welcome, sign-in, sign-up, forgot-password
- `READER_ROUTE`: `(reader)/[id]` — full-screen push, no tab bar
- `MINI_PLAYER_LOCATION`: rendered in `(tabs)/_layout.tsx` above the tab bar
- `PERSISTENT_OVERLAYS`: MiniPlayerBar, OfflineBanner, DownloadToast — all in
  root or tab layout
- `BOOKMARKS_UI`: bottom sheet inside the Reader screen
- `VOICE_MANAGEMENT_ROUTE`: `(settings)/voices/index` and
  `(settings)/voices/[modelId]`
- `SCREEN_COMPONENT_MAX_LINES`: 200 lines at scaffold stage

### Text input sources

- `TEXT_INPUT_MODES`: paste, url, file
- `TEXT_INPUT_DIR`: `src/lib/text/`
- `URL_EXTRACTOR_LIBRARY`: @mozilla/readability (with a React Native-compatible
  DOMParser shim)
- `FILE_PICKER_LIBRARY`: expo-document-picker
- `FILE_READER_LIBRARY`: expo-file-system
- `SUPPORTED_FILE_TYPES`: text/plain (.txt), application/pdf (.pdf — stub TODOs
  for native extraction)
- `TEXT_EXTRACTION_CONTRACT`: all extractors return
  `{ text: string; label?: string }` before entering the TTS pipeline
- `PDF_EXTRACTION_STATUS`: typed stub — mark as TODO; native module integration
  optional

---

## Recommended execution order

If you want the highest chance of success with an LLM agent, use this exact
order:

1. Agent operating mode prompt
2. Prompt 1 - Architecture and execution plan
3. Prompt 2 - Scaffold the repository and shared TypeScript contracts
4. Prompt 12 - Screen scaffolding and navigation map
5. Prompt 3 - Generate the local Expo native module
6. Prompt 4 - Implement model download, install, extraction, and registry
7. Prompt 5 - Implement chunking, caching, playback queue, and fallback behavior
8. Prompt 11 - Text input sources (paste, URL, file)
9. Prompt 8 - Design system tokens and theming _(can run in parallel with
   Prompt 10)_
10. Prompt 9 - Supabase data access SDK _(can run in parallel with Prompt 10)_
11. Prompt 10 - Multi-language support and i18n _(can run in parallel with
    Prompts 8 and 9)_
12. Prompt 6 - QA, hardening, cleanup, and developer docs
13. Prompt 7 - Tests and validation harnesses

---

## Practical advice

- Start with one Piper model first, even if the final system supports all four
  families.
- Use the agent to create the stable vertical slice before asking it to optimize
  quality or UI.
- Ask the agent to show files changed after each phase.
- If the agent starts inventing native APIs, stop it and rerun Prompt 3 with
  stricter wording.
- If the repo is large, tell the agent to work incrementally and keep imports,
  exports, and folder structure consistent.

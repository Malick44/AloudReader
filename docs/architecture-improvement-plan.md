# Architecture Improvement Plan

Last updated: 2026-03-08

## 1. Executive summary

The project already has a solid technical base:

- Expo Router is set up cleanly for navigation.
- The local TTS runtime is separated into its own module and service layer.
- The data layer already has a dedicated SDK structure with explicit rules.
- Design tokens, theme, and i18n are separated from screens.

The main architecture problem is **inconsistency of boundaries**.

Today the codebase is partly:

- **route-based** in `app/`
- **layer-based** in `src/data`, `src/lib`, `src/theme`, `src/i18n`
- **feature-based** only for TTS in `src/features/tts`

That mix makes the code workable now, but it will become harder to read and
change as more features are added.

## 2. Current architecture assessment

### What is working well

1. **Routing is understandable**
   - Route groups are clearly split between auth, tabs, reader, library, and
     settings.

2. **TTS is the most mature feature area**
   - `src/lib/tts/` contains a deep runtime pipeline.
   - `src/features/tts/` already holds UI-facing state and hooks.

3. **Data access is intentionally isolated**
   - `src/data/` has codecs, queries, repos, RPC wrappers, and a public index.
   - There is already a boundary check script.

4. **Cross-cutting concerns are separated**
   - Theme, styles, i18n, and reusable UI components are not mixed into native
     code.

### Main issues to fix

1. **Screens are too heavy and know too much**
   - Several route files in `app/` fetch data, manage UI state, own async flows,
     and compose UI in one file.
   - This makes screens harder to test and reuse.

2. **Feature boundaries are inconsistent**
   - TTS is modeled as a feature.
   - Library, search, listen, settings, and auth are mostly modeled as screens
     only.
   - This creates uneven structure and weak discoverability.

3. **The data boundary is documented but not consistently followed**
   - The data SDK document says UI should import from `src/data/index.ts` only.
   - Current screens import directly from repo and codec internals.

4. **`app/` contains both real app routes and legacy/dev routes**
   - Demo and benchmark screens live beside production routes.
   - This makes the route tree noisier than necessary.

5. **Shared code placement is broad and ambiguous**
   - `src/lib/` currently mixes substantial domain logic.
   - Over time that tends to become a catch-all folder.

6. **Repeated screen patterns already exist**
   - Listing, loading, empty state, and fetch logic are repeated in
     library/history/search-style screens.

## 3. Target architecture goals

The target should be:

- **easy to scan**: a developer should know where a change belongs in under 30
  seconds
- **easy to modify**: feature changes should mostly stay inside one feature
  folder
- **easy to test**: business logic should live outside route files
- **safe to scale**: dependency direction should be enforced
- **explicit**: domain, app, and infrastructure responsibilities should be clear

## 4. Recommended target structure

Use a **feature-first architecture with shared platform layers**.

### Proposed top-level structure

```text
app/                    # routing only
src/
  app/                  # app-wide providers, bootstrapping, navigation helpers
  shared/               # reusable UI, hooks, utils, theme, i18n, config
  features/
    auth/
    library/
    reader/
    search/
    listen/
    settings/
    tts/
  entities/             # optional: shared domain models if needed later
  infrastructure/
    data/               # supabase client, repos, codecs, rpc, persistence
    native/             # native module adapters if needed
```

### Practical mapping from the current code

- Move `src/components/ui` -> `src/shared/ui`
- Move `src/theme`, `src/styles`, `src/i18n`, and general `src/utils` ->
  `src/shared/*`
- Move `src/data` -> `src/infrastructure/data`
- Keep the native module in `modules/expo-local-tts`
- Split current TTS code into:
  - `src/features/tts/` for feature-facing hooks, stores, view-model logic
  - `src/infrastructure/native/tts` or `src/features/tts/core` for
    engine/runtime internals

## 5. Folder responsibilities

### `app/`

Keep `app/` as a **thin routing layer only**.

Allowed in route files:

- route params
- navigation wiring
- provider composition when route-specific
- rendering a feature screen container

Avoid in route files:

- direct repository imports
- business rules
- large async orchestration
- large view definitions mixed with data loading

### `src/features/<feature>/`

Each feature should own:

- `screens/` or `containers/`
- `components/`
- `hooks/`
- `store/`
- `services/` or `use-cases/`
- `types/`
- `index.ts`

Example:

```text
src/features/library/
  screens/
    LibraryScreen.tsx
    HistoryScreen.tsx
    DocumentDetailScreen.tsx
  components/
    DocumentCard.tsx
    DocumentList.tsx
    EmptyLibraryState.tsx
  hooks/
    useLibraryDocuments.ts
    useDocumentDetail.ts
  services/
    library-service.ts
  types/
    library.types.ts
  index.ts
```

### `src/shared/`

Use `shared` only for code that is truly reusable across multiple features.

Good fits:

- design system components
- common hooks
- theme and tokens
- i18n
- logging
- generic utilities
- app config

### `src/infrastructure/`

Keep implementation details here:

- Supabase client
- repos
- codecs
- persistence
- native adapters
- file system adapters

This makes it clear that features depend on infrastructure through small public
APIs, not the other way around.

## 6. Dependency rules

Adopt and enforce these rules:

1. `app/` may import from `src/features/*` and `src/app/*` only.
2. `src/features/*` may import from:
   - their own feature
   - `src/shared/*`
   - approved public infrastructure APIs
3. `src/shared/*` must not import feature code.
4. `src/infrastructure/*` must not import route files or UI components.
5. UI must never import deep infrastructure internals directly when a public
   feature/service API exists.

### Public API rule

Every major folder should expose a stable `index.ts`.

Examples:

- `src/features/library/index.ts`
- `src/features/reader/index.ts`
- `src/shared/ui/index.ts`
- `src/infrastructure/data/index.ts`

No screen should import from deep internal paths unless explicitly allowed.

## 7. Concrete problems found in the current project

### A. Data-layer internals are imported directly by screens

Current examples:

- `app/(tabs)/index.tsx` imports `@/data/repos/documents.repo`
- `app/(tabs)/search.tsx` imports `@/data/repos/search.repo`
- `app/(library)/history.tsx` imports `@/data/repos/documents.repo`
- `app/(library)/[id].tsx` imports both repo and codec internals
- `app/(reader)/[id].tsx` imports `@/data/repos/documents.repo`

This conflicts with the documented data SDK rule that UI should use the public
data API only.

### B. Route files carry orchestration logic

Examples:

- Reader route starts playback, loads document content, configures headers, and
  syncs store state.
- Listen route handles extraction strategy selection, input management, async
  loading, preview, and navigation.
- Voice settings screens directly orchestrate install/list/activate flows.

These should move into feature hooks/services so routes remain small.

### C. Production and development routes are mixed

Current route tree includes:

- `app/benchmark.tsx`
- `app/tts-demo.tsx`
- `app/reader-demo.tsx`
- `app/physical-qa.tsx`

These should be isolated into a dedicated dev/qa area.

### D. Screen logic is duplicated

`Library`, `History`, and `Search` all repeat fetch/loading/empty/list rendering
patterns with slight changes.

That is a sign to extract:

- feature hooks
- shared list components
- empty/loading state components

## 8. Refactor roadmap

## Phase 0 — Guardrails first

Goal: prevent architecture from drifting further.

Tasks:

1. Add a short architecture document to the repo root or docs.
2. Enforce import boundaries with lint rules or a dependency checker.
3. Expand the existing data boundary script to also prevent:
   - direct `@/data/repos/*` imports from `app/`
   - direct `@/data/codecs/*` imports from UI layers
   - direct deep imports into feature internals
4. Define naming rules:
   - `Screen` suffix for route-facing screens
   - `useXxx` for hooks
   - `service` or `use-case` for business orchestration

Success criteria:

- New code cannot bypass agreed boundaries.
- Developers know where new files belong.

## Phase 1 — Make `app/` thin

Goal: route files become wrappers, not implementation hubs.

Tasks:

1. Create feature folders for:
   - `src/features/library`
   - `src/features/reader`
   - `src/features/search`
   - `src/features/listen`
   - `src/features/settings`
   - `src/features/auth`
2. Move current route implementations into feature screens.
3. Leave `app/...` files as simple route wrappers.

Example target pattern:

```tsx
// app/(tabs)/index.tsx
export { LibraryRoute as default } from "@/features/library";
```

Success criteria:

- Route files are usually under 15 lines.
- Business logic lives inside feature folders.

## Phase 2 — Normalize data access

Goal: UI talks to stable feature-facing APIs, not deep data internals.

Tasks:

1. Expose stable data APIs from a single public entry.
2. Create feature services that wrap infrastructure calls.
3. Stop importing DTO codecs directly into screens.
4. Introduce feature-level types when UI needs a view model.

Recommended pattern:

- infrastructure DTO -> feature mapper -> feature view model -> screen

Success criteria:

- No route file imports from deep `repos`, `codecs`, `selects`, or `supabase`
  paths.
- Repositories can change without touching screen code.

## Phase 3 — Extract reusable UI and flows

Goal: reduce duplication and improve readability.

Tasks:

1. Create reusable screen-state primitives:
   - `LoadingState`
   - `EmptyState`
   - `ErrorState`
2. Extract domain UI pieces such as:
   - `DocumentCard`
   - `DocumentList`
   - `SearchInput`
   - `ReaderControls`
   - `VoiceRow`
3. Move async logic into hooks:
   - `useLibraryDocuments()`
   - `useSearchDocuments()`
   - `useDocumentDetail()`
   - `useVoiceCatalog()`
   - `useListenInput()`

Success criteria:

- Repeated list/loading code is minimized.
- Screens mostly compose components and hooks.

## Phase 4 — Separate app code from QA/dev tools

Goal: production routes stay clean.

Tasks:

1. Move demo and benchmark routes under a dedicated group, for example:

```text
app/(dev)/
  benchmark.tsx
  tts-demo.tsx
  reader-demo.tsx
  physical-qa.tsx
```

2. Hide this group behind a development flag or internal entry point.
3. Keep QA utilities out of the main navigation unless explicitly enabled.

Success criteria:

- Route tree is easier to understand.
- Production navigation is not cluttered by internal tools.

## Phase 5 — Strengthen quality gates

Goal: keep the architecture healthy long term.

Tasks:

1. Add architecture tests or dependency linting.
2. Add unit tests for:
   - text extraction logic
   - TTS orchestration logic
   - feature services/hooks
3. Add lightweight screen tests for critical flows.
4. Add ADRs (architecture decision records) for major design choices.

Success criteria:

- Refactors are safer.
- Architectural decisions are documented, not tribal knowledge.

## 9. Recommended target for the TTS area

TTS is already the most advanced area. Do not flatten it.

Instead, clarify it.

### Suggested split

```text
src/features/tts/
  hooks/
  store/
  components/
  screens/
  services/
  index.ts

src/infrastructure/native/tts/
  pipeline/
  installer/
  registry/
  synthesis/
  catalog/
```

Why:

- The current TTS runtime is valuable but dense.
- Separating feature-facing APIs from engine internals will make it easier to
  maintain.
- UI should depend on a small TTS service surface, not the full runtime folder.

## 10. Suggested first 2-week execution plan

### Week 1

1. Approve architecture rules and folder naming.
2. Create `src/shared` and `src/infrastructure` folders.
3. Add import-boundary enforcement.
4. Move only wrappers into `app/` and relocate implementations into feature
   folders.

### Week 2

1. Refactor library/history/search into feature modules.
2. Add shared loading/empty/error components.
3. Replace deep data imports with public APIs.
4. Move dev routes into a dedicated route group.

## 11. Prioritized quick wins

If you want the highest impact with lowest risk, do these first:

1. **Thin the `app/` folder**
2. **Create feature folders for non-TTS domains**
3. **Stop deep imports from `src/data` internals**
4. **Move demo/benchmark routes into a dev group**
5. **Extract repeated list/loading/empty patterns**

## 12. Definition of done for the architecture refactor

The architecture is in a good state when:

- a new feature can be added without touching unrelated folders
- route files are small and mostly declarative
- UI does not import infrastructure internals directly
- shared code is obviously shared and not feature-specific
- dev tools are separated from production navigation
- business logic is testable without rendering route files

## 13. Final recommendation

Do **not** do a big-bang rewrite.

Use an incremental refactor in this order:

1. guardrails
2. thin route layer
3. feature folders
4. stable public APIs
5. shared UI extraction
6. quality gates

This project already has strong foundations. The improvement needed is mainly
**structural consistency**, not a full technical reset.

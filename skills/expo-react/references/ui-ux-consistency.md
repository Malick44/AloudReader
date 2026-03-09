# AloudReader UI/UX Consistency & Product Experience Guide

## Purpose

Define how AloudReader should look, feel, and behave across screens so design and implementation decisions stay aligned.

This guide is the bridge between:

- product identity: how the app should feel
- design tokens and shared primitives: how the app is built
- feature requirements: what each workflow must support

Use this document to guide layout, hierarchy, component usage, motion, states, and screen composition.

---

## Product character

AloudReader is not a generic content app and not a promotional consumer product. It is a focused reading and listening companion designed to reduce academic friction and support comprehension, retention, and continuity.

The product should feel:

- calm and mentally spacious
- legible and low-noise
- dependable and continuity-first
- tactile in audio control
- supportive of active learning
- private, trustworthy, and non-promotional

The product should not feel:

- visually busy
- decorative for its own sake
- gamified
- ad-like
- hyper-animated
- unpredictable in navigation, playback, or state

Every screen should reinforce the sense that the app is a quiet study environment.

---

## Source of truth

Use the existing app patterns as the default implementation baseline.

- Routing: `expo-router` with route groups under `app/`
- Theming: `src/theme/ThemeProvider.tsx` and `src/theme/useThemeColors.ts`
- Tokens: `src/styles/tokens/colors.ts`, `spacing.ts`, and `typography.ts`
- Responsive behavior: `src/shared/responsive/useResponsiveLayout.ts`
- Shared primitives: `src/components/ui/Button.tsx`, `Input.tsx`, `Card.tsx`,
  `OfflineBanner.tsx`, and other `src/components/ui/**`
- Localization: `src/i18n/**` with `useAppTranslation()`

The active implementation model is React Native with `StyleSheet` and semantic tokens. Treat the codebase as the source of truth over any older Tailwind-oriented design notes.

---

## Core experience principles

### 1. Calm focus over visual density

Favor breathing room, strong hierarchy, and low visual noise. Dense academic content already carries cognitive weight; the interface should reduce friction rather than compete with the material.

### 2. Reading first, controls second

The content surface is the primary experience. Controls must be available and usable, but should not dominate unless the user is in an active study or playback adjustment state.

### 3. Tactile control for comprehension

Playback interactions should feel direct, dependable, and easy to repeat. Skip back, speed control, bookmarking, and chapter movement should feel deliberate and low-friction.

### 4. Trustworthy continuity

Users must feel safe pausing, resuming, navigating, and returning later. Reading position, playback state, download state, and offline status should always be communicated clearly.

### 5. Active-learning support without clutter

Study tools should be easy to reach, but visually quiet until needed. The UI should support deep engagement, not constantly demand attention.

### 6. Accessibility is part of the product feel

Legibility, contrast, touch target size, localization expansion, assistive technologies, and reduced visual noise are not edge concerns. They define the quality of the experience.

---

## Visual language

### Overall visual direction

AloudReader should feel like a premium study companion: quiet, spacious, editorial, and focused.

Prefer:

- generous spacing
- restrained color usage
- strong text hierarchy
- soft, unified surfaces
- clear grouping of related actions
- subtle depth rather than flashy decoration

Avoid:

- hard visual fragmentation
- heavy borders everywhere
- loud color competition
- excessive shadows
- glassy overlays, gradients, or decorative effects that interfere with reading
- dashboard-like overcrowding on reading-heavy screens

### Tone of the interface

- Library and settings screens should feel structured and calm.
- Reader and listening screens should feel immersive and even quieter.
- Study Mode may surface more controls, but should still preserve calm hierarchy.
- Empty, loading, offline, and error states must match the same steady tone.

---

## Hierarchy rules

A screen should never feel visually ambiguous. Users should immediately understand:

1. what screen they are on
2. what the primary task is
3. what action matters most right now
4. what supporting information is secondary

### Required hierarchy pattern

Each screen should have:

- one clear primary focus area
- one primary action region
- secondary actions that are quieter in contrast and placement
- supportive metadata that does not compete with main content

### Primary action rules

- The primary action should be visually obvious without shouting.
- Use accent color and emphasis sparingly, mainly for the primary action, current playback state, progress, and active study cues.
- Do not create multiple competing primary buttons on the same screen.
- Destructive actions must be visually separated from progression actions.

### Text hierarchy rules

- Page title should be the dominant text element.
- Section headings should clearly separate content groups.
- Body and helper text should be easy to scan and never overly compressed.
- Metadata should use lower emphasis and shorter line lengths where possible.
- Avoid too many text sizes on the same screen.

---

## Layout rhythm

Using tokens is necessary but not sufficient. Layouts should follow a repeatable spacing rhythm that creates visual calm.

### Spacing intent

Use spacing to communicate relationship:

- tight spacing for items that belong together
- medium spacing within a card or form group
- large spacing between major sections
- generous top spacing so screens do not feel cramped on entry

### Layout rules

- Prefer consistent page padding and section spacing across related screens.
- Major sections should feel clearly separated.
- Avoid stacking too many visually equal cards without grouping.
- Reading-heavy screens should minimize unnecessary containers and nesting.
- Forms should feel narrow and controlled rather than stretched and loose.
- Tablet layouts should increase breathing room and width intelligently, not simply scale every element larger.

### Width rules

Honor responsive layout values from `useResponsiveLayout()`:

- use `contentMaxWidth` for general centered content
- use `formMaxWidth` for form-driven screens
- use `readingMaxWidth` for text-heavy reading surfaces

Do not invent custom breakpoint math when the shared responsive hook already provides the intended behavior.

---

## Screen composition patterns

### Default screen recipe

For new screens, prefer this sequence:

1. Get `colors` from `useThemeColors()`
2. Get translated copy from `useAppTranslation()`
3. Get layout values from `useResponsiveLayout()` when the screen owns spacing or width
4. Apply the page background from theme
5. Center wide content using the appropriate max-width value
6. Use shared primitives for actions, fields, banners, and surfaces
7. Handle loading, empty, error, disabled, and offline states before polishing the happy path
8. Refine hierarchy, spacing, and emphasis so the screen feels calm and intentional

### Library screens

Library views should feel orderly, scannable, and lightweight.

- Prioritize content discoverability over decorative chrome
- Keep filters and sort controls accessible but quiet
- Avoid visual overload from too many badges, pills, or competing accents
- Loading and empty states should preserve the same layout rhythm as populated states

### Reader screens

Reader views should feel immersive, stable, and low-noise.

- Reading always wins over decoration
- Avoid excessive framing around text
- Keep controls reachable but secondary when the user is actively reading
- Preserve a stable visual anchor so returning to the screen feels continuous

### Listening screens

Listening views should feel tactile and confidence-building.

- Playback state should be immediately understandable
- The current progress and available actions should be visually clear
- Controls should feel balanced, not crowded
- Skip, pause, speed, and bookmark actions should be easy to hit repeatedly

### Settings and utility screens

These should feel consistent, compact, and calm.

- Group related options into clear sections
- Avoid dense rows with weak hierarchy
- Helper text should be concise and supportive
- State changes should feel predictable and explainable

---

## Component feel

### Buttons

- Primary buttons should feel confident, clear, and easy to tap
- Secondary buttons should stay visually quieter
- Destructive buttons should be clearly separated and unmistakable
- Full-width primary buttons are preferred on phone when the action is central to task completion

### Inputs

- Inputs should feel clean, steady, and easy to scan
- Labels should do the main explanatory work; placeholders should not carry critical meaning
- Helper and validation text should be concise and calm
- Inputs should visually align with cards and surrounding spacing rhythm

### Cards and surfaces

- Cards should provide structure, not noise
- Prefer soft separation and clean grouping over heavy decoration
- Use surfaces to cluster meaningfully related content
- Avoid turning every block into an equally weighted card

### Lists

- Lists should feel ordered and easy to scan
- Use dividers, spacing, grouping, and metadata intentionally rather than mechanically
- Multi-column layouts on larger screens should follow existing responsive patterns

### Banners and system feedback

- Offline and degraded-state indicators should be informative but not alarming
- Use calm language and restrained visual emphasis
- System messaging should support trust, not anxiety

---

## Study Mode and active-learning behavior

Study Mode should increase access to learning-critical controls without breaking the calm visual hierarchy.

### Synchronized highlighting

- Highlight the active sentence, not word-by-word
- Highlighting should remain muted and low-contrast in both themes
- Auto-scroll should feel smooth and anchored, not jumpy
- When the user manually interacts, pause auto-follow gracefully

### Bookmarking and notes

- Bookmarking should be available with minimal friction
- Bookmark indicators should stay quiet in the layout
- Notes and bookmarks views should prioritize scanability and review efficiency

### Granular playback

- Skip Back 10s and Skip Forward 10s should be persistent and easy to repeat
- Playback speed should be accessible on the main reading/listening surface
- Fine-grained speed adjustments should feel available without cluttering the screen
- Semantic navigation across headings, chapters, or sections should feel fast and predictable

### Standard mode vs Study Mode

- Standard mode: lighter, quieter, minimal intervention
- Study Mode: more visible comprehension tools, but still restrained
- Increased control density must only serve learning-critical tasks
- Both modes must preserve continuity, reading position, and playback confidence

---

## Motion and transitions

Motion should be subtle, purposeful, and never decorative for its own sake.

Use motion to:

- confirm an action
- preserve orientation during navigation
- make playback or loading state transitions feel clear
- support continuity between related states

Avoid motion that:

- competes with reading
- feels bouncy or playful
- causes flicker around highlighted text
- creates uncertainty about whether playback, loading, or saving has completed

State changes should feel smooth and dependable, especially around playback, downloads, bookmarks, and offline recovery.

---

## Accessibility and localization

### Accessibility rules

- All interactive elements must expose correct accessibility roles and disabled state
- Touch targets must remain comfortably tappable
- Contrast must stay strong in both light and dark themes
- Reading surfaces must remain legible under extended use
- Do not rely on color alone to communicate state
- Support assistive technologies without breaking layout or semantics

### Localization rules

- All user-visible strings must come from translations
- Test longer strings and non-English locales before considering a layout complete
- Prefer concise labels and helper text
- Consider RTL implications for alignment and directional interactions

A layout is not done if it only works in English or only looks balanced with short labels.

---

## Styling rules

- Prefer `StyleSheet.create(...)` for stable reusable styles
- Use semantic theme values such as `colors.background`, `colors.surface`,
  `colors.foreground`, and `colors.border`
- Use `spacingTokens` for padding, margin, and gaps
- Use `typographyTokens` when introducing new text scale decisions
- Avoid raw hex values, arbitrary opacity-heavy overlays, and one-off radii
  unless tokens are updated first
- Keep shadows and decorative treatments subtle
- Do not introduce a marketing-site visual language into core product screens

---

## Reuse and extraction rules

- First reuse an existing component
- If reuse becomes awkward in two or more places, extract a shared primitive
- Theme-aware primitives belong in `src/components/ui/`
- Domain-specific logic belongs in `src/features/<feature>/`
- UI components should receive clean props and remain visually consistent with the system

Consistency should not mean copying weak patterns blindly. Reuse the system, but improve it when necessary in a way that strengthens the product language.

---

## UX rules specific to AloudReader

- Prioritize legibility over density
- Make the primary action obvious on each screen
- Keep destructive actions separated and clearly labeled
- Respect offline state, loading TTS assets, interrupted playback, and unavailable content
- Preserve continuity between library, reader, listen, and settings flows
- Avoid surprising navigation; back behavior and route ownership should remain predictable within the current route group
- Support return-to-task behavior so users can resume study sessions with minimal cognitive overhead

---

## Definition of done for UI changes

A UI task is not complete until all of the following are true:

- Uses theme colors instead of raw values
- Reuses or improves shared primitives instead of duplicating patterns
- Handles loading, empty, error, offline, and disabled states where relevant
- Works in light mode and dark mode
- Works on phone and tablet widths
- Uses localized strings
- Preserves accessibility semantics
- Maintains clear visual hierarchy
- Uses spacing intentionally rather than mechanically
- Keeps the primary task obvious
- Fits the calm, readable, study-oriented product tone of AloudReader

---

## Final standard

AloudReader should feel like a dependable study companion: quiet, spacious, legible, and tactically useful. The interface should reduce cognitive overhead, make reading and listening feel continuous, and surface powerful study tools without ever becoming visually noisy or behaviorally unpredictable.
# Product Identity

## Purpose

Define the product character of AloudReader so design and implementation
decisions stay consistent across screens, controls, motion, copy, and states.

This document should guide how the product feels, while token and component docs
guide how the product is built.

## Product essence

AloudReader should feel like a focused, calm reading companion and an empowering
tool for comprehension and retention. It is designed to reduce academic friction
and support multimodal learning.

It should be:

- focused-reader calm: reducing academic anxiety and cognitive overload
- tactile in audio interactions: allowing granular control over pacing for study
  purposes
- legible and low-noise: highlighting content over UI elements
- dependable in offline or degraded conditions: reliable for studying anywhere,
  anytime
- respectful of attention, time, and cognitive load: optimizing the environment
  for deep learning
- supportive of multimodal processing: seamlessly syncing text and audio for
  active engagement

It should not feel:

- busy or overly decorative: no distractions from the study material
- gamified: avoid superficial streaks or badges; motivation should come from
  progress and comprehension
- ad-like or promotional: a completely private, safe space for learning
- unpredictable in navigation or playback behavior: no lost places in textbooks
  or articles
- like a passive entertainment app: it should invite active reading and
  listening

## Experience principles

### 1. Calm focus & Cognitive support

- Favor clean hierarchy over dense information packing to reduce study fatigue.
- Reduce visual noise around reading and playback surfaces.
- Keep the primary task obvious on each screen, allowing the student's mental
  energy to remain on the material.

### 2. Tactile audio control for comprehension

- Playback controls should feel direct, clear, and responsive.
- Navigation must support granular study habits, such as precise scrubbing, easy
  10-second rewind for missed concepts, and variable playback speeds.
- Important audio actions should be easy to discover and easy to repeat.
- Destructive or session-ending actions should feel intentional, not fragile.

### 3. Trustworthy continuity

- Always remember exact reading positions so study sessions can be paused and
  resumed across multiple sessions without friction or lost context.
- The app should communicate state clearly during loading, offline mode, and
  interrupted playback.
- Preserve continuity across library, reader, listen, and settings flows.
- Avoid surprising route changes or hidden side effects.

### 4. Accessible & Synchronized legibility

- Reading always wins over decoration.
- Any visual pacing indicators, such as highlighting spoken words, must be
  precise and unobtrusive to support reading-while-listening without causing
  motion sickness or distraction.
- Controls and text should remain understandable in light and dark themes,
  supporting late-night study sessions.
- Language expansion, screen size changes, and assistive technologies must not
  break the experience.

## Implications for UI decisions

- Use spacious layouts rather than cramped density to give dense academic texts
  room to breathe.
- Prefer a restrained palette and semantic emphasis.
- Make study tools, such as speed adjustment, bookmarks, and jumping between
  chapters, readily accessible but quiet in the interface.
- Keep motion subtle and purposeful.
- Make primary actions obvious and secondary actions quiet.
- Design empty, loading, offline, and error states with the same calm tone as
  the happy path.

## Implications for copy

- Use plain, reassuring language to mitigate study anxiety.
- Avoid hype language and unnecessary excitement.
- Use clear, study-oriented terminology where appropriate, such as “Library”,
  “Chapters”, and “Playback speed”, without sounding overly formal or
  institutional.
- Prefer concise labels with clear intent.
- Error and offline messages should feel supportive, not alarming.

## Study Mode UI Behaviors

When a user engages deeply with academic or complex material, the interface must
actively support comprehension without adding cognitive load. The following
principles govern Study Mode and other active-learning states within
AloudReader.

### Synchronized highlighting

- Highlight the active sentence rather than word-by-word to reduce visual
  flicker and eye strain.
- Use muted, low-contrast background colors for text highlights so the reading
  surface stays calm in both theme modes.
- Ensure smooth auto-scrolling that keeps the active text anchored in the
  upper-middle third of the screen.
- Disable highlighting when the user directly interacts with the screen,
  gracefully pausing auto-scroll until playback resumes.

### Bookmarking and annotations

- Enable single-tap bookmarking directly from playback controls so students can
  mark important concepts without pausing audio.
- Place bookmark indicators quietly in the margin so they do not disrupt text
  alignment or reading flow.
- Design the aggregated Notes & Bookmarks view with clean typography and easy
  scanning for review before an exam or study session.

### Granular playback and navigation

- Provide dedicated, persistent Skip Back 10s and Skip Forward 10s controls for
  immediate review of missed concepts.
- Expose playback speed controls directly on the reading surface instead of
  hiding them in a submenu.
- Allow fine-tuned speed increments, including 0.1x steps, so learners can match
  narration to their processing speed.
- Support semantic navigation so users can jump quickly between document
  headings, chapters, or syllabus topics.

### Standard vs. Study Mode comparison

To maintain the app's versatility, differentiate the default reading experience
from the active study experience based on the user's current need.

- Standard mode should feel lighter, quieter, and optimized for continuous
  reading or listening with minimal intervention.
- Study Mode should surface comprehension tools more prominently while still
  preserving calm visual hierarchy.
- Switching into a deeper study state should increase control density only for
  learning-critical actions, not for decorative or distracting options.
- Both modes must preserve continuity, reading position, and confidence in the
  playback state.

## Relationship to other docs

- `docs/design-system-tokens.md`: reusable visual values.
- `skills/expo-react/references/ui-ux-consistency.md`: implementation and layout
  consistency rules.
- Feature docs: feature-specific requirements and constraints, such as TTS
  engine specs and text parsing limits.

## When to update this document

Update this document when the team makes a product-level decision about:

- the tone of the app
- how studying, reading, and listening should feel
- interaction principles for playback controls and active learning features
- visual restraint vs. expressiveness
- trust, accessibility, and interruption handling expectations

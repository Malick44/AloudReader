# Physical Device QA Guide

Last updated: 2026-03-05

## Scope

Validate long-form local TTS synthesis and cache behavior on real devices (not simulators, not emulators, not Expo Go).

## Current status (2026-03-05)

- iOS physical device detected (`Mlick'iPhone`, iPhone 14 Pro Max), but build target is blocked until Developer Mode is enabled on the phone.
- Android physical device not attached in current session.
- In-app QA flow is ready at route `/physical-qa`.

## Preflight

1. Use a development build (`npx expo run:ios` / `npx expo run:android`), not Expo Go.
2. Install at least one local model (for example `en-us-amy`, `en-us-ryan`, `en-us-lessac-high`).
3. Confirm app opens and `Physical QA` screen is reachable from Home.

## iOS physical setup

1. On the iPhone, enable Developer Mode:
   - `Settings -> Privacy & Security -> Developer Mode`
2. Reboot the device if prompted.
3. Re-run:
   - `npx expo run:ios --device 00008120-001045D822D0C01E`

## Android physical setup

1. Connect device via USB and enable USB debugging.
2. Verify:
   - `adb devices -l`
3. Forward Metro:
   - `adb reverse tcp:8081 tcp:8081`
4. Run:
   - `npx expo run:android`

## Long-form cache QA procedure

1. Open `Physical QA` screen.
2. Select installed model.
3. Keep default long-form text (or paste your own paragraph set).
4. Tap `Run Long-form QA`.
5. Record:
   - Cold duration vs warm duration
   - Cold cache hits vs warm cache hits
   - Fallback chunks and failed chunks
   - Report JSON path shown in screen status card

## Pass criteria

- Warm run is faster than cold run for same text/model (`warmupGainMs > 0`).
- Warm cache hits are near chunk count on second pass.
- Fallback chunk count is 0 for healthy Sherpa models.
- Failed chunk count is 0.
- Audio remains intelligible and continuous for long-form playback.

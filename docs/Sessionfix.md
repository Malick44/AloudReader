# iOS Model Download Fixes

**Date:** 2026-03-09  
**Affected files:**
- `src/lib/tts/model-installer.ts`
- `src/lib/tts/path-utils.ts`

---

## Background

On iOS, tapping **Install** on the Voices screen (or triggering `bootstrapDefaultModel` on
app launch) would silently fail to download and register TTS models. The app would show a
download spinner, hit an error, and leave the model uninstalled — with no clear indication
of what went wrong.

Four distinct bugs were identified and fixed. All are iOS-specific or iOS-first in their
impact, though some also affect Android edge cases.

---

## Bug 1 — Stale registry path from a previous simulator container

### What happened

`expo-file-system/legacy` stores files under a per-app-install UUID path on iOS:

```
/Users/.../CoreSimulator/Devices/<device-uuid>/data/Containers/Data/Application/<app-uuid>/Documents/tts/...
```

When the app is reinstalled (or the simulator container is reset), the `<app-uuid>` part
changes. However, `registry.json` persists across JS-only reloads and can hold paths from a
_previous_ container. On the next launch, `bootstrapDefaultModel` reads the stale registry
entry, detects that the required model files are missing, and tries to repair the install:

```ts
// Before fix
onStatus?.('repairing-stale-install');
await removePath(existing.installDir);   // <-- throws "not writable" on iOS
await removeInstalledEntry(existing.modelId);
```

`deleteAsync` on iOS raises `"File '...' is not writable"` when the **parent directory**
does not exist (rather than the more informative "no such file"). Because the old container
path is completely gone, this error is thrown immediately and propagates all the way up,
aborting the repair before any new directory is created or any download starts.

### Fix

1. **Wrapped the `removePath` call in `.catch(() => undefined)`** so a dead/stale path
   never aborts the repair flow:

   ```ts
   // After fix — model-installer.ts
   onStatus?.('repairing-stale-install');
   await removePath(existing.installDir).catch(() => undefined); // best-effort
   await removeInstalledEntry(existing.modelId);
   ```

2. **Made `removePath` itself treat "not writable" / "no such file" / "does not exist"
   errors as a no-op** in `path-utils.ts`. On iOS these all mean the target is already
   gone, which is the desired end state for a delete operation:

   ```ts
   // After fix — path-utils.ts
   const msg = lastError instanceof Error ? lastError.message.toLowerCase() : '';
   if (
     msg.includes('not writable') ||
     msg.includes('no such file') ||
     msg.includes('does not exist')
   ) {
     return; // already gone — treat as success
   }
   ```

---

## Bug 2 — `deleteAsync` rejects raw POSIX paths on iOS

### What happened

`expo-file-system/legacy`'s `deleteAsync`, `makeDirectoryAsync`, and related functions
require a **`file://` URI** on iOS. Passing a raw POSIX path (e.g.
`/path/to/tts/piper/en-us-amy`) causes the "not writable" error above even when the file
_does_ exist on disk.

The original `getCandidatePaths` helper tried the raw path first and the `file://` form
second. On iOS, the first attempt always failed, and `deleteAsync`'s error swallowing in the
loop meant the `file://` form was never actually reached before the error was rethrown.

### Fix

`removePath` now constructs candidates in the correct priority order — **`file://` URI
first**, raw path as fallback — matching how `ensureDirectory` already worked:

```ts
// After fix — path-utils.ts
const primary = toFileSystemPath(path); // produces file:// URI
const candidates = [...new Set([primary, path].filter(Boolean))];
```

---

## Bug 3 — Concurrent install race condition (bootstrap vs. user tap)

### What happened

`useVoiceCatalog` and `VoiceDetailScreen` both call `bootstrapDefaultModel()` on mount.
`bootstrapDefaultModel` calls `ensureModelInitialized` → `installFromCatalog` →
`installModel`. If the user tapped **Install** for the same model while the bootstrap was
already in progress, two separate `installModel` calls ran concurrently for the same model
ID.

Both calls execute this sequence:

```ts
await removePath(modelDirectory);      // wipes the directory
await ensureDirectory(modelDirectory); // creates it empty
// ... starts downloading files into modelDirectory
```

The second call would wipe the directory the first was actively writing into, resulting in
a partially-written install directory that failed asset validation, causing the whole
install to be rolled back and deleted.

### Fix

A `modelInstallsInFlight` dedup Map was added at module scope. When `installModel` is
called for a model that is already being installed, all callers share the same in-flight
`Promise` and receive the same resolved result:

```ts
// model-installer.ts
const modelInstallsInFlight = new Map<string, Promise<InstalledModel>>();

export async function installModel(params: InstallModelParams): Promise<InstalledModel> {
  const { model } = params;

  const inFlight = modelInstallsInFlight.get(model.id);
  if (inFlight) {
    return inFlight; // join the existing install instead of starting a new one
  }

  const promise = doInstallModel(params).finally(() => {
    modelInstallsInFlight.delete(model.id);
  });
  modelInstallsInFlight.set(model.id, promise);
  return promise;
}
```

---

## Bug 4 — Concurrent espeak-ng-data download race condition

### What happened

Piper-family voices (the majority of the catalog) require a shared `espeak-ng-data`
directory (~15 MB, ~300 files). `ensureSharedEspeakData` is called during every Piper
model install. If two Piper models were installed concurrently (e.g. the default
`en-us-lessac-high` bootstrap plus a second model the user tapped), both calls would:

1. Detect the shared directory is absent or incomplete.
2. Call `removePath(sharedDir)` — wiping any partial download the other call had started.
3. Both start downloading ~300 files into the same directory at the same time.

The result was a corrupt `espeak-ng-data` directory with randomly missing or overwritten
files, causing the marker-file check to fail and rolling back both installs.

### Fix

An `espeakDownloadInFlight` module-level dedup guard was added. All concurrent callers
share one download promise:

```ts
// model-installer.ts
let espeakDownloadInFlight: Promise<string> | null = null;

async function ensureSharedEspeakData(onStatus?: (status: string) => void): Promise<string> {
  if (!espeakDownloadInFlight) {
    espeakDownloadInFlight = doEnsureSharedEspeakData(onStatus).finally(() => {
      espeakDownloadInFlight = null;
    });
  }
  return espeakDownloadInFlight;
}
```

---

## Bug 5 — Strict HTTP 200 check rejects CDN responses

### What happened

HuggingFace serves model files through a CDN that issues HTTP `206 Partial Content`
responses for large files (the ONNX binaries can be 60–200 MB). The original status check
was:

```ts
if (download.status !== 200) {
  throw new TtsError('DOWNLOAD_FAILED', `Artifact download failed with status ${download.status}.`);
}
```

A `206` response would throw `DOWNLOAD_FAILED` even though the file was downloaded
correctly. This was more likely to surface on iOS because the iOS networking stack more
aggressively uses range requests for large transfers.

### Fix

Changed all three download status checks (archive, artifact, espeak) to accept any 2xx
response:

```ts
// After fix
if (result.status < 200 || result.status >= 300) {
  throw new TtsError('DOWNLOAD_FAILED', `Artifact download failed with status ${result.status}.`);
}
```

---

## Summary table

| # | Bug | Root cause | Fix location |
|---|-----|------------|-------------|
| 1 | Stale container path aborts repair | `deleteAsync` throws "not writable" on missing parent | `model-installer.ts`, `path-utils.ts` |
| 2 | Raw POSIX paths rejected by `deleteAsync` on iOS | `file://` URI required by `expo-file-system/legacy` | `path-utils.ts` |
| 3 | Concurrent installs corrupt each other's model directory | No dedup on `installModel` | `model-installer.ts` |
| 4 | Concurrent installs corrupt shared `espeak-ng-data` | No dedup on `ensureSharedEspeakData` | `model-installer.ts` |
| 5 | CDN `206` response treated as download failure | Strict `!== 200` status check | `model-installer.ts` |

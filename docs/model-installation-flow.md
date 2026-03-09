# Model Installation Flow

## Flow

1. Check registry for existing install (idempotent path).
2. Prepare model directory under `<tts>/<family>/<model-id>/`.
3. Download archive (`archiveUrl`) and unzip, or download listed artifacts.
4. Verify optional SHA-256 checksums for archives/artifacts when provided in catalog.
5. Discover required files by family heuristics (`model-validation.ts`).
6. Build normalized `TtsModelConfig`.
7. Compute size and write `registry.json` atomically.

## Error classes

- `DOWNLOAD_FAILED`
- `EXTRACTION_FAILED`
- `MODEL_VALIDATION_FAILED`
- `REGISTRY_FAILED`
- `INSTALL_FAILED`

## Checksum support

- `ModelCatalogEntry.checksumSha256` validates archive downloads (`archiveUrl` / `localArchivePath`) when set.
- `ModelCatalogEntry.artifactChecksumsSha256` validates per-file artifact downloads by relative path.

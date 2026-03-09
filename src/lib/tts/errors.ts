export type TtsErrorCode =
  | 'INVALID_INPUT'
  | 'NATIVE_NOT_READY'
  | 'NATIVE_FAILURE'
  | 'MODEL_NOT_FOUND'
  | 'MODEL_VALIDATION_FAILED'
  | 'INSTALL_FAILED'
  | 'DOWNLOAD_FAILED'
  | 'EXTRACTION_FAILED'
  | 'REGISTRY_FAILED'
  | 'CACHE_FAILED'
  | 'PLAYBACK_FAILED'
  | 'UNSUPPORTED_ARCHIVE';

export class TtsError extends Error {
  code: TtsErrorCode;
  metadata?: Record<string, unknown>;

  constructor(code: TtsErrorCode, message: string, metadata?: Record<string, unknown>) {
    super(message);
    this.name = 'TtsError';
    this.code = code;
    this.metadata = metadata;
  }
}

export function asTtsError(
  error: unknown,
  code: TtsErrorCode,
  fallbackMessage: string,
  metadata?: Record<string, unknown>
): TtsError {
  if (error instanceof TtsError) {
    return error;
  }

  if (error instanceof Error) {
    return new TtsError(code, error.message, { ...metadata, cause: error.name });
  }

  return new TtsError(code, fallbackMessage, metadata);
}

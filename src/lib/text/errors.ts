export type TextExtractionErrorCode =
  | 'URL_FETCH_FAILED'
  | 'URL_NO_CONTENT'
  | 'URL_TIMEOUT'
  | 'FILE_PICK_CANCELLED'
  | 'FILE_READ_FAILED'
  | 'FILE_UNSUPPORTED_TYPE'
  | 'PDF_NOT_SUPPORTED'
  | 'EMPTY_TEXT';

export class TextExtractionError extends Error {
  readonly code: TextExtractionErrorCode;

  constructor(code: TextExtractionErrorCode, message: string) {
    super(message);
    this.name = 'TextExtractionError';
    this.code = code;
  }
}

export type TextSourceType = 'paste' | 'url' | 'file';

export interface TextSource {
  type: TextSourceType;
  text: string;
  /** Human-readable label: a title for URL/file, or undefined for paste. */
  label?: string;
}

export interface UrlExtractResult {
  type: 'url';
  url: string;
  title: string;
  text: string;
}

export interface FileExtractResult {
  type: 'file';
  filename: string;
  mimeType: string;
  text: string;
}

export interface PasteExtractResult {
  type: 'paste';
  text: string;
}

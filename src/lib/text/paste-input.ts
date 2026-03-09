import { TextExtractionError } from './errors';
import { PasteExtractResult } from './types';

/**
 * Normalizes raw pasted or typed text: collapses multiple blank lines,
 * trims whitespace, and validates that the result is non-empty.
 */
export function normalizePastedText(raw: string): PasteExtractResult {
  const text = raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (!text) {
    throw new TextExtractionError('EMPTY_TEXT', 'Pasted text is empty after normalization.');
  }

  return { type: 'paste', text };
}

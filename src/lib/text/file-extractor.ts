/**
 * File text extractor — uses expo-document-picker to let the user select a
 * local file and expo-file-system to read its content.
 *
 * Supported types:
 *  - text/plain (.txt) — fully supported
 *  - application/pdf (.pdf) — TODO: typed stub; native extraction needed
 */
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

import { TextExtractionError } from './errors';
import { FileExtractResult } from './types';

const SUPPORTED_MIME_TYPES = ['text/plain', 'application/pdf'] as const;
type SupportedMime = (typeof SUPPORTED_MIME_TYPES)[number];

function isSupportedMime(mime: string | undefined): mime is SupportedMime {
  return SUPPORTED_MIME_TYPES.includes(mime as SupportedMime);
}

async function readTextFile(uri: string): Promise<string> {
  try {
    return await FileSystem.readAsStringAsync(uri, { encoding: 'utf8' });
  } catch (err) {
    throw new TextExtractionError('FILE_READ_FAILED', `Failed to read file: ${String(err)}`);
  }
}

// TODO: Implement PDF text extraction using a native module.
// Currently returns a typed stub error so the UI can surface a clear message.
async function readPdfFile(_uri: string): Promise<string> {
  throw new TextExtractionError(
    'PDF_NOT_SUPPORTED',
    'PDF text extraction is not yet implemented. Please use a .txt file.'
  );
}

/**
 * Opens the system file picker, reads the selected file, and returns its text.
 * Throws TextExtractionError if the user cancels, the type is unsupported, or
 * the file cannot be read.
 */
export async function extractTextFromFile(): Promise<FileExtractResult> {
  const result = await DocumentPicker.getDocumentAsync({
    type: SUPPORTED_MIME_TYPES as unknown as string[],
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled) {
    throw new TextExtractionError('FILE_PICK_CANCELLED', 'User cancelled file selection.');
  }

  const asset = result.assets[0];
  if (!asset) {
    throw new TextExtractionError('FILE_READ_FAILED', 'No file asset returned from picker.');
  }

  const mimeType = asset.mimeType ?? '';
  if (!isSupportedMime(mimeType)) {
    throw new TextExtractionError(
      'FILE_UNSUPPORTED_TYPE',
      `Unsupported file type: ${mimeType}. Use .txt or .pdf.`
    );
  }

  const text =
    mimeType === 'application/pdf'
      ? await readPdfFile(asset.uri)
      : await readTextFile(asset.uri);

  const trimmed = text.trim();
  if (!trimmed) {
    throw new TextExtractionError('EMPTY_TEXT', 'Selected file contains no readable text.');
  }

  return {
    type: 'file',
    filename: asset.name,
    mimeType,
    text: trimmed,
  };
}

import { DEFAULT_CHUNK_SIZE, MIN_CHUNK_SIZE } from './constants';
import { ChunkMetadata, ChunkerOptions } from './types';

function splitSentences(paragraph: string): string[] {
  const split = paragraph.match(/[^.!?]+[.!?]+|[^.!?]+$/g);
  return split ? split.map((segment) => segment.trim()).filter(Boolean) : [paragraph];
}

export function chunkText(input: string, options: ChunkerOptions = {}): ChunkMetadata[] {
  const normalized = input.replace(/\r\n/g, '\n').trim();
  if (!normalized) {
    return [];
  }

  const maxChunkChars = options.maxChunkChars ?? DEFAULT_CHUNK_SIZE;
  const minChunkChars = options.minChunkChars ?? MIN_CHUNK_SIZE;
  const paragraphs = normalized.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean);

  const chunks: ChunkMetadata[] = [];
  let globalOffset = 0;
  let index = 0;

  for (let paragraphIndex = 0; paragraphIndex < paragraphs.length; paragraphIndex += 1) {
    const paragraph = paragraphs[paragraphIndex];
    const sentences = splitSentences(paragraph);

    let current = '';
    let currentStart = globalOffset;

    for (const sentence of sentences) {
      const spacer = current.length > 0 ? ' ' : '';
      const candidate = `${current}${spacer}${sentence}`.trim();
      const shouldFlush = candidate.length > maxChunkChars && current.length >= minChunkChars;

      if (shouldFlush) {
        chunks.push({
          id: `chunk-${index}`,
          index,
          text: current,
          paragraphIndex,
          startChar: currentStart,
          endChar: currentStart + current.length,
        });
        index += 1;
        current = sentence;
        currentStart = globalOffset + paragraph.indexOf(sentence);
      } else {
        current = candidate;
      }
    }

    if (current) {
      chunks.push({
        id: `chunk-${index}`,
        index,
        text: current,
        paragraphIndex,
        startChar: currentStart,
        endChar: currentStart + current.length,
      });
      index += 1;
    }

    globalOffset += paragraph.length + 2;
  }

  return chunks;
}

import * as FileSystem from 'expo-file-system/legacy';

import { clearAudioCache, createCacheKey, getAudioCacheStats, getCachedAudioForKey } from './cache';
import { chunkText } from './chunker';
import { DEFAULT_CHUNK_SIZE } from './constants';
import { preparePipeline } from './pipeline';
import { getWritableBaseDirectory, joinPath } from './path-utils';

export const LONG_FORM_QA_DEFAULT_TEXT = [
  'AloudReader long-form quality assurance sample begins here.',
  'This passage intentionally mixes short and long sentences to stress chunking behavior, model synthesis latency, and cache reuse across repeated runs.',
  'When the first run starts from a cold cache, every chunk should require native synthesis and file write.',
  'The second run should reuse previously generated wave files and therefore complete much faster, while preserving audible continuity and intelligibility.',
  'Please verify that highlighted chunks advance in order, pause and resume remain responsive, and no fallback to system voices occurs unless explicitly expected.',
  'Add your own multilingual or punctuation-heavy paragraphs here to exercise routing and pronunciation edge cases.',
  '',
  'Paragraph two repeats to increase runtime for realistic long-form checks on physical hardware.',
  'Reading on-device helps detect thermal throttling, I/O pressure, and lock-screen behavior that simulators and emulators often hide.',
  'Capture the generated JSON report and compare cold versus warm metrics after each model install or native module change.',
].join(' ');

export type LongFormQaPassMetrics = {
  label: 'cold' | 'warm';
  durationMs: number;
  chunkCount: number;
  averageChunkChars: number;
  cacheHitsBefore: number;
  cacheMissesBefore: number;
  synthesizedCount: number;
  fallbackCount: number;
  failureCount: number;
};

export type LongFormQaReport = {
  createdAt: string;
  modelId: string;
  language: string;
  chunkSize: number;
  textChars: number;
  textPreview: string;
  cold: LongFormQaPassMetrics;
  warm: LongFormQaPassMetrics;
  warmupGainMs: number;
  warmupGainPercent: number;
  cache: {
    directory: string;
    fileCount: number;
    totalBytes: number;
  };
};

export type RunLongFormCacheQaOptions = {
  modelId: string;
  text?: string;
  language?: string;
  chunkSize?: number;
  fallbackToSystemTts?: boolean;
  clearCacheFirst?: boolean;
  onStatus?: (status: string) => void;
};

export type RunLongFormCacheQaResult = {
  report: LongFormQaReport;
  reportPath: string;
};

async function countCacheHitsBefore(
  text: string,
  input: {
    modelId: string;
    language: string;
    chunkSize: number;
  }
): Promise<{ chunkCount: number; averageChunkChars: number; cacheHitsBefore: number; cacheMissesBefore: number }> {
  const chunks = chunkText(text, { maxChunkChars: input.chunkSize });
  if (chunks.length === 0) {
    return {
      chunkCount: 0,
      averageChunkChars: 0,
      cacheHitsBefore: 0,
      cacheMissesBefore: 0,
    };
  }

  const keys = await Promise.all(
    chunks.map((chunk) =>
      createCacheKey({
        modelId: input.modelId,
        text: chunk.text,
        language: input.language,
      })
    )
  );

  const hits = await Promise.all(keys.map((key) => getCachedAudioForKey(key)));
  const cacheHitsBefore = hits.filter(Boolean).length;
  const averageChunkChars = Math.round(
    chunks.reduce((sum, chunk) => sum + chunk.text.length, 0) / chunks.length
  );

  return {
    chunkCount: chunks.length,
    averageChunkChars,
    cacheHitsBefore,
    cacheMissesBefore: Math.max(0, chunks.length - cacheHitsBefore),
  };
}

async function runQaPass(
  label: 'cold' | 'warm',
  text: string,
  options: {
    modelId: string;
    language: string;
    chunkSize: number;
    fallbackToSystemTts: boolean;
    onStatus?: (status: string) => void;
  }
): Promise<LongFormQaPassMetrics> {
  options.onStatus?.(`Preparing ${label} pass...`);
  const before = await countCacheHitsBefore(text, {
    modelId: options.modelId,
    language: options.language,
    chunkSize: options.chunkSize,
  });

  options.onStatus?.(`Synthesizing ${label} pass...`);
  const startedAt = Date.now();
  const pipeline = await preparePipeline(text, {
    modelId: options.modelId,
    language: options.language,
    chunkSize: options.chunkSize,
    fallbackToSystemTts: options.fallbackToSystemTts,
  });
  const durationMs = Date.now() - startedAt;

  const withAudio = pipeline.chunks.filter((item) => Boolean(item.audioPath)).length;
  const fallbackCount = pipeline.chunks.filter((item) => item.usedFallback).length;
  const failureCount = pipeline.chunks.filter((item) => !item.audioPath).length;
  const synthesizedCount = Math.max(0, withAudio - before.cacheHitsBefore);

  return {
    label,
    durationMs,
    chunkCount: before.chunkCount,
    averageChunkChars: before.averageChunkChars,
    cacheHitsBefore: before.cacheHitsBefore,
    cacheMissesBefore: before.cacheMissesBefore,
    synthesizedCount,
    fallbackCount,
    failureCount,
  };
}

async function writeReport(report: LongFormQaReport): Promise<string> {
  const reportDirectory = joinPath(getWritableBaseDirectory(), 'tts', 'benchmarks');
  await FileSystem.makeDirectoryAsync(reportDirectory, { intermediates: true });
  const slug = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = joinPath(reportDirectory, `long-form-cache-qa-${slug}.json`);
  await FileSystem.writeAsStringAsync(reportPath, JSON.stringify(report, null, 2));
  return reportPath;
}

export async function runLongFormCacheQa(
  options: RunLongFormCacheQaOptions
): Promise<RunLongFormCacheQaResult> {
  const text = options.text?.trim() ? options.text : LONG_FORM_QA_DEFAULT_TEXT;
  const chunkSize = options.chunkSize ?? DEFAULT_CHUNK_SIZE;
  const language = options.language ?? 'en-US';
  const clearCacheFirst = options.clearCacheFirst ?? true;
  const fallbackToSystemTts = options.fallbackToSystemTts ?? true;

  if (clearCacheFirst) {
    options.onStatus?.('Clearing cache for cold run...');
    await clearAudioCache();
  }

  const cold = await runQaPass('cold', text, {
    modelId: options.modelId,
    language,
    chunkSize,
    fallbackToSystemTts,
    onStatus: options.onStatus,
  });

  const warm = await runQaPass('warm', text, {
    modelId: options.modelId,
    language,
    chunkSize,
    fallbackToSystemTts,
    onStatus: options.onStatus,
  });

  const cache = await getAudioCacheStats();
  const warmupGainMs = cold.durationMs - warm.durationMs;
  const warmupGainPercent =
    cold.durationMs > 0 ? (warmupGainMs / cold.durationMs) * 100 : 0;

  const report: LongFormQaReport = {
    createdAt: new Date().toISOString(),
    modelId: options.modelId,
    language,
    chunkSize,
    textChars: text.length,
    textPreview: text.slice(0, 240),
    cold,
    warm,
    warmupGainMs,
    warmupGainPercent,
    cache,
  };

  options.onStatus?.('Writing QA report...');
  const reportPath = await writeReport(report);
  options.onStatus?.('Long-form cache QA complete.');
  return { report, reportPath };
}

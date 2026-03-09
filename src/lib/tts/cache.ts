import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';

import { ensureTtsLayout, getCacheDirectory, getCachedAudioPath } from './file-layout';
import { TtsError, asTtsError } from './errors';
import { ensureDirectory, listFilesRecursive, pathExists, removePath } from './path-utils';

export type AudioCacheStats = {
  directory: string;
  fileCount: number;
  totalBytes: number;
};

// Bump WAV_FORMAT_VERSION whenever the synthesized audio format changes
// (e.g. silence padding added) so that stale cached files are re-generated.
const WAV_FORMAT_VERSION = 3;

export async function createCacheKey(input: {
  modelId: string;
  text: string;
  language?: string;
  speed?: number;
  speakerId?: number;
}): Promise<string> {
  const payload = JSON.stringify({
    v: WAV_FORMAT_VERSION,
    modelId: input.modelId,
    text: input.text,
    language: input.language ?? 'default',
    speed: input.speed ?? 1,
    speakerId: input.speakerId ?? 0,
  });

  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, payload);
}

export async function getCachedAudioForKey(cacheKey: string): Promise<string | null> {
  await ensureTtsLayout();
  const path = getCachedAudioPath(cacheKey);
  return (await pathExists(path)) ? path : null;
}

export async function reserveCachePath(cacheKey: string): Promise<string> {
  await ensureTtsLayout();
  return getCachedAudioPath(cacheKey);
}

export async function saveToCache(sourcePath: string, cacheKey: string): Promise<string> {
  const targetPath = await reserveCachePath(cacheKey);
  try {
    if (sourcePath !== targetPath) {
      await FileSystem.copyAsync({ from: sourcePath, to: targetPath });
    }
    return targetPath;
  } catch (error) {
    throw asTtsError(error, 'CACHE_FAILED', 'Failed to save synthesized audio to cache.', {
      sourcePath,
      targetPath,
    });
  }
}

export async function assertCachedFile(path: string): Promise<void> {
  if (!(await pathExists(path))) {
    throw new TtsError('CACHE_FAILED', `Cached file does not exist: ${path}`);
  }
}

export async function clearAudioCache(): Promise<void> {
  await ensureTtsLayout();
  const directory = getCacheDirectory();
  await removePath(directory);
  await ensureDirectory(directory);
}

export async function getAudioCacheStats(): Promise<AudioCacheStats> {
  await ensureTtsLayout();
  const directory = getCacheDirectory();
  const files = await listFilesRecursive(directory);

  let totalBytes = 0;
  for (const filePath of files) {
    const info = await FileSystem.getInfoAsync(filePath);
    if (!info.exists || info.isDirectory) {
      continue;
    }
    const size = 'size' in info && typeof info.size === 'number' ? info.size : 0;
    totalBytes += size;
  }

  return {
    directory,
    fileCount: files.length,
    totalBytes,
  };
}

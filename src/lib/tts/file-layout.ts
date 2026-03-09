import { CACHE_DIR_NAME, REGISTRY_FILE_NAME, TTS_ROOT_DIR_NAME } from './constants';
import { TtsModelFamily } from './types';
import { ensureDirectory, getWritableBaseDirectory, joinPath, sanitizeFolderName } from './path-utils';

export function getTtsRootDirectory(): string {
  return joinPath(getWritableBaseDirectory(), TTS_ROOT_DIR_NAME);
}

export function getRegistryFilePath(): string {
  return joinPath(getTtsRootDirectory(), REGISTRY_FILE_NAME);
}

export function getCacheDirectory(): string {
  return joinPath(getTtsRootDirectory(), CACHE_DIR_NAME);
}

export function getFamilyDirectory(family: TtsModelFamily): string {
  return joinPath(getTtsRootDirectory(), family);
}

export function getModelDirectory(family: TtsModelFamily, modelId: string): string {
  return joinPath(getFamilyDirectory(family), sanitizeFolderName(modelId));
}

export function getArchivePath(modelId: string): string {
  return joinPath(getTtsRootDirectory(), 'downloads', `${sanitizeFolderName(modelId)}.zip`);
}

export function getCachedAudioPath(cacheKey: string): string {
  return joinPath(getCacheDirectory(), `${cacheKey}.wav`);
}

export async function ensureTtsLayout(): Promise<void> {
  await ensureDirectory(getTtsRootDirectory());
  await ensureDirectory(joinPath(getTtsRootDirectory(), 'downloads'));
  await ensureDirectory(getCacheDirectory());
  await ensureDirectory(getFamilyDirectory('piper'));
  await ensureDirectory(getFamilyDirectory('kokoro'));
  await ensureDirectory(getFamilyDirectory('vits'));
  await ensureDirectory(getFamilyDirectory('matcha'));
}

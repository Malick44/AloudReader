import * as FileSystem from 'expo-file-system/legacy';

import { TtsError } from './errors';

function normalizeSegment(segment: string): string {
  return segment.replace(/^\/+|\/+$/g, '');
}

export function joinPath(base: string, ...segments: string[]): string {
  const normalizedBase = base.replace(/\/+$/g, '');
  const normalizedSegments = segments.map(normalizeSegment).filter(Boolean);
  return [normalizedBase, ...normalizedSegments].join('/');
}

export function getWritableBaseDirectory(): string {
  const base = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
  if (!base) {
    throw new TtsError('REGISTRY_FAILED', 'No writable file-system directory is available.');
  }
  return base;
}

export async function pathExists(path: string): Promise<boolean> {
  const info = await FileSystem.getInfoAsync(path);
  return info.exists;
}

export async function ensureDirectory(path: string): Promise<void> {
  await FileSystem.makeDirectoryAsync(path, { intermediates: true });
}

export async function removePath(path: string): Promise<void> {
  await FileSystem.deleteAsync(path, { idempotent: true });
}

export async function readJsonFile<T>(path: string, fallback: T): Promise<T> {
  const exists = await pathExists(path);
  if (!exists) {
    return fallback;
  }
  const content = await FileSystem.readAsStringAsync(path);
  try {
    return JSON.parse(content) as T;
  } catch {
    return fallback;
  }
}

export async function writeJsonAtomic(path: string, value: unknown): Promise<void> {
  const tempPath = `${path}.tmp`;
  await FileSystem.writeAsStringAsync(tempPath, JSON.stringify(value, null, 2));
  await FileSystem.moveAsync({ from: tempPath, to: path });
}

export async function listFilesRecursive(root: string): Promise<string[]> {
  const result: string[] = [];
  const stack = [root];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    const entries = await FileSystem.readDirectoryAsync(current);
    for (const entry of entries) {
      const fullPath = joinPath(current, entry);
      const info = await FileSystem.getInfoAsync(fullPath);
      if (info.exists && info.isDirectory) {
        stack.push(fullPath);
      } else if (info.exists) {
        result.push(fullPath);
      }
    }
  }

  return result;
}

export function sanitizeFolderName(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-{2,}/g, '-').replace(/^-+|-+$/g, '');
}

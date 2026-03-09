import * as FileSystem from 'expo-file-system/legacy';

import { TtsError } from './errors';

function hasUriScheme(path: string): boolean {
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(path);
}

function toFileSystemPath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) {
    return trimmed;
  }

  if (hasUriScheme(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith('/')) {
    return `file://${trimmed}`;
  }

  return trimmed;
}

function getCandidatePaths(path: string): string[] {
  const normalized = toFileSystemPath(path);
  return [...new Set([path, normalized].filter(Boolean))];
}

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
  for (const candidate of getCandidatePaths(path)) {
    try {
      const info = await FileSystem.getInfoAsync(candidate);
      if (info.exists) {
        return true;
      }
    } catch {
      // Try alternate path forms before failing.
    }
  }

  return false;
}

export async function ensureDirectory(path: string): Promise<void> {
  await FileSystem.makeDirectoryAsync(toFileSystemPath(path), { intermediates: true });
}

export async function removePath(path: string): Promise<void> {
  if (!path.trim()) {
    return;
  }

  // Always use the file:// URI form first — expo-file-system/legacy requires it
  // on iOS. Fall back to the raw path if the normalized form fails.
  const primary = toFileSystemPath(path);
  const candidates = [...new Set([primary, path].filter(Boolean))];

  let lastError: unknown;

  for (const candidate of candidates) {
    try {
      await FileSystem.deleteAsync(candidate, { idempotent: true });
      return;
    } catch (error) {
      lastError = error;
    }
  }

  // On iOS, deleteAsync can throw "not writable" when the path's parent directory
  // doesn't exist (e.g. stale paths from a previous simulator container). That
  // is effectively the same as "already gone", so treat it as a no-op.
  const msg = lastError instanceof Error ? lastError.message.toLowerCase() : '';
  if (msg.includes('not writable') || msg.includes('no such file') || msg.includes('does not exist')) {
    return;
  }

  if (lastError) {
    throw lastError;
  }
}

export async function readJsonFile<T>(path: string, fallback: T): Promise<T> {
  const exists = await pathExists(path);
  if (!exists) {
    return fallback;
  }

  const content = await FileSystem.readAsStringAsync(toFileSystemPath(path));
  try {
    return JSON.parse(content) as T;
  } catch {
    return fallback;
  }
}

export async function writeJsonAtomic(path: string, value: unknown): Promise<void> {
  const normalizedPath = toFileSystemPath(path);
  const tempPath = `${normalizedPath}.tmp`;
  await FileSystem.writeAsStringAsync(tempPath, JSON.stringify(value, null, 2));
  await FileSystem.moveAsync({ from: tempPath, to: normalizedPath });
}

export async function listFilesRecursive(root: string): Promise<string[]> {
  const result: string[] = [];
  const stack = [toFileSystemPath(root)];

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

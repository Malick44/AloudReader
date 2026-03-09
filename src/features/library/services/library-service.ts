/**
 * library-service.ts
 *
 * Local-first data access for the library feature.
 *
 * Pattern
 * -------
 * 1. Read from the local Zustand store (hydrated from AsyncStorage) immediately.
 * 2. Fire a background Supabase fetch regardless.
 * 3. When the remote response arrives, update the store so the UI reflects
 *    the latest server state.
 *
 * This means the UI always renders immediately (no full-screen spinner on
 * subsequent launches) and eventually converges to server truth.
 */

import { randomUUID } from 'expo-crypto';

import { documentsRepo, getCurrentUserId, isSupabaseConfigured } from '@/data';
import type { DocumentCardDto, DocumentDetailDto } from '@/data';
import { useLibraryStore } from '../store/library-store';

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

/**
 * Returns locally-cached documents instantly and triggers a background
 * refresh from Supabase. The caller should subscribe to the store for
 * live updates.
 */
export async function refreshLibraryDocuments(): Promise<DocumentCardDto[]> {
    const remote = await documentsRepo.listDocuments({ sort: 'updated_desc' });
    useLibraryStore.getState().setDocuments(remote);
    return remote;
}

/**
 * Returns the current documents from the local cache synchronously.
 * Always call refreshLibraryDocuments() alongside this to keep the cache warm.
 */
export function getCachedLibraryDocuments(): DocumentCardDto[] {
    return useLibraryStore.getState().documents;
}

// ---------------------------------------------------------------------------
// Detail
// ---------------------------------------------------------------------------

/**
 * Returns locally-cached detail (if available) and triggers a background
 * refresh.
 */
export async function refreshDocumentDetail(id: string): Promise<DocumentDetailDto> {
    const remote = await documentsRepo.getDocumentDetail(id);
    useLibraryStore.getState().setDetail(remote);
    return remote;
}

export function getCachedDocumentDetail(id: string): DocumentDetailDto | null {
    return useLibraryStore.getState().details[id] ?? null;
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function deleteLibraryDocument(id: string): Promise<void> {
    await documentsRepo.deleteDocument(id);
    // Optimistically remove from local cache regardless of network state.
    useLibraryStore.getState().removeDocument(id);
}

// ---------------------------------------------------------------------------
// Create / Save
// ---------------------------------------------------------------------------

export type SaveDocumentInput = {
    title: string;
    body: string;
    language?: string;
    sourceType?: 'pdf' | 'article' | 'note';
};

/**
 * Saves a new document to the library.
 *
 * Strategy:
 * 1. If Supabase is configured AND a user is signed in → create a remote row
 *    and cache the result locally.
 * 2. Otherwise → create a local-only document (uuid, stored in AsyncStorage)
 *    so the app works fully offline or without auth.
 */
export async function saveDocumentToLibrary(input: SaveDocumentInput): Promise<DocumentDetailDto> {
    const { title, body, language = 'en', sourceType = 'note' } = input;
    const now = new Date().toISOString();

    if (isSupabaseConfigured) {
        const userId = await getCurrentUserId();
        if (userId) {
            const remote = await documentsRepo.createDocument({
                userId,
                title,
                body,
                language,
                sourceType,
            });
            useLibraryStore.getState().setDetail(remote);
            // Invalidate list so next mount re-fetches
            useLibraryStore.getState().setDocuments([
                { id: remote.id, title: remote.title, language: remote.language, source_type: remote.source_type, updated_at: remote.updated_at },
                ...useLibraryStore.getState().documents.filter((d) => d.id !== remote.id),
            ]);
            return remote;
        }
    }

    // Local-only fallback
    const localDoc: DocumentDetailDto = {
        id: randomUUID(),
        title,
        body,
        language,
        source_type: sourceType,
        created_at: now,
        updated_at: now,
    };
    useLibraryStore.getState().setDetail(localDoc);
    useLibraryStore.getState().addOrUpdateDocument({
        id: localDoc.id,
        title: localDoc.title,
        language: localDoc.language,
        source_type: localDoc.source_type,
        updated_at: localDoc.updated_at,
    });
    return localDoc;
}

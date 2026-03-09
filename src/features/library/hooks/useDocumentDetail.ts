/**
 * useDocumentDetail
 *
 * Local-first hook for a single document detail.
 *
 * Behaviour:
 * - Immediately returns the cached detail if present (e.g. the user already
 *   opened this document in a previous session).
 * - Always fires a background refresh from Supabase on mount so the displayed
 *   content converges to the latest server version.
 * - `loading` is only true when the cache is empty AND the fetch is in flight.
 */

import { useCallback, useEffect, useState } from 'react';

import type { LibraryDocumentDetail } from '../types';
import { useLibraryStore } from '../store/library-store';
import {
    getCachedDocumentDetail,
    refreshDocumentDetail,
} from '../services/library-service';

export function useDocumentDetail(id?: string) {
    // Hydrate synchronously from the local cache.
    const cachedDetail = id ? (useLibraryStore.getState().details[id] as LibraryDocumentDetail | undefined) : undefined;

    const [document, setDocument] = useState<LibraryDocumentDetail | null>(cachedDetail ?? null);
    const [loading, setLoading] = useState(!cachedDetail && Boolean(id));
    const [refreshing, setRefreshing] = useState(false);

    // Keep `document` in sync with any store updates from other callers.
    useEffect(() => {
        if (!id) return;
        const cached = getCachedDocumentDetail(id) as LibraryDocumentDetail | null;
        if (cached) setDocument(cached);
    }, [id]);

    const refresh = useCallback(async () => {
        if (!id) return;
        setRefreshing(true);
        try {
            const detail = await refreshDocumentDetail(id) as LibraryDocumentDetail;
            setDocument(detail);
        } catch {
            // Keep whatever we had cached; don't blank the UI for a refresh failure.
        } finally {
            setRefreshing(false);
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (!id) {
            setDocument(null);
            setLoading(false);
            return;
        }
        // If we already have cached data, show it immediately and revalidate
        // in the background (stale-while-revalidate pattern).
        if (!cachedDetail) setLoading(true);
        refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    return { document, loading, refreshing, refresh };
}

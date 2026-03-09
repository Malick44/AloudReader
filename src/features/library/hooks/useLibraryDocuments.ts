/**
 * useLibraryDocuments
 *
 * Local-first hook for the document list.
 *
 * Behaviour:
 * - Immediately returns the locally-persisted document list (zero loading
 *   delay on subsequent launches).
 * - Fires a background refresh from Supabase on every mount (or when the
 *   cached data is stale).
 * - `refreshing` is true only during the background network fetch, allowing
 *   the UI to show a non-blocking pull-to-refresh indicator rather than a
 *   full-screen spinner.
 */

import { useCallback, useEffect, useState } from 'react';

import type { LibraryDocument } from '../types';
import { useLibraryStore } from '../store/library-store';
import { refreshLibraryDocuments } from '../services/library-service';

export function useLibraryDocuments() {
    // Hydrate from persisted store synchronously – no spinner on warm starts.
    const documents = useLibraryStore((s) => s.documents) as LibraryDocument[];
    const isFresh = useLibraryStore((s) => s.isFresh);

    // `loading` is only true on the very first cold start (empty cache + no
    // data yet). On subsequent launches the cache is populated instantly.
    const [loading, setLoading] = useState(documents.length === 0);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        setRefreshing(true);
        setError(null);
        try {
            await refreshLibraryDocuments();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to refresh library');
        } finally {
            setRefreshing(false);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Always revalidate in the background; skip only when data is still fresh
        // AND we already have something to show.
        if (isFresh() && documents.length > 0) {
            setLoading(false);
            return;
        }
        refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { documents, loading, refreshing, error, refresh };
}

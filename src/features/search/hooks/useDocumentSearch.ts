import { useState } from 'react';

import type { SearchResultDto } from '@/data';

import { searchLibraryDocuments } from '../services/search-service';

export function useDocumentSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResultDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    async function search(q: string) {
        if (!q.trim()) return;
        setLoading(true);
        setSearched(true);
        try {
            const data = await searchLibraryDocuments(q.trim());
            setResults(data);
        } catch {
            setResults([]);
        } finally {
            setLoading(false);
        }
    }

    function updateQuery(nextValue: string) {
        setQuery(nextValue);
        if (!nextValue.trim()) {
            setResults([]);
            setSearched(false);
        }
    }

    return { query, results, loading, searched, search, updateQuery };
}

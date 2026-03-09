import { searchRepo } from '@/data';

export function searchLibraryDocuments(query: string) {
    return searchRepo.searchDocuments({ q: query });
}

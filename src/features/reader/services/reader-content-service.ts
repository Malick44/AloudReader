import { documentsRepo } from '@/data';
import { getCachedDocumentDetail } from '@/features/library/services/library-service';

export type ReaderRouteParams = {
    id: string;
    text?: string;
    title?: string;
};

export type ReaderContent = {
    text: string;
    title: string;
};

export async function resolveReaderContent(
    params: ReaderRouteParams,
    fallbackTitle: string
): Promise<ReaderContent | null> {
    if (params.id === '__new__' && params.text) {
        return {
            text: params.text,
            title: params.title ?? fallbackTitle,
        };
    }

    // Check the local-first cache first — works offline and avoids a
    // round-trip when the document was just saved from the Listen screen.
    const cached = getCachedDocumentDetail(params.id);
    if (cached) {
        return { text: cached.body, title: cached.title };
    }

    try {
        const document = await documentsRepo.getDocumentDetail(params.id);
        return {
            text: document.body,
            title: document.title,
        };
    } catch {
        return null;
    }
}

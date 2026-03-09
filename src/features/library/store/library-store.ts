/**
 * library-store.ts
 *
 * Zustand store that acts as the local-first cache for library documents.
 * Documents are persisted to AsyncStorage so the library is immediately
 * available on the next cold start — before any network call completes.
 *
 * Shape:
 *   documents   – list of DocumentCardDto (cards only; body is NOT stored here)
 *   details     – map of id → DocumentDetailDto (full documents, loaded on demand)
 *   lastFetched – unix-ms timestamp of the last successful remote list fetch
 *
 * Cache TTL: list is considered "fresh" for CACHE_TTL_MS; after that a background
 * revalidation fires automatically when useLibraryDocuments mounts.
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { DocumentCardDto, DocumentDetailDto } from '@/data';

/** How long (ms) the cached list is considered fresh without a remote check. */
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LibraryStoreState = {
  /** Ordered list of document cards (mirrors the last known remote result). */
  documents: DocumentCardDto[];
  /** Full document detail keyed by document id. */
  details: Record<string, DocumentDetailDto>;
  /** Unix timestamp (ms) of when the list was last successfully refreshed. */
  lastFetched: number | null;

  // --- Selectors ---

  /** True when the cached list can be shown as-is without a forced refresh. */
  isFresh: () => boolean;

  // --- Mutators ---

  setDocuments: (docs: DocumentCardDto[]) => void;
  setDetail: (doc: DocumentDetailDto) => void;
  removeDocument: (id: string) => void;
  addOrUpdateDocument: (doc: DocumentCardDto) => void;
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useLibraryStore = create<LibraryStoreState>()(
  persist(
    (set, get) => ({
      documents: [],
      details: {},
      lastFetched: null,

      isFresh: () => {
        const { lastFetched } = get();
        if (lastFetched === null) return false;
        return Date.now() - lastFetched < CACHE_TTL_MS;
      },

      setDocuments: (docs) =>
        set({ documents: docs, lastFetched: Date.now() }),

      setDetail: (doc) =>
        set((state) => ({
          details: { ...state.details, [doc.id]: doc },
          // Also keep the card list in sync when a detail is loaded.
          documents: state.documents.some((d) => d.id === doc.id)
            ? state.documents.map((d) =>
                d.id === doc.id
                  ? { id: doc.id, title: doc.title, language: doc.language, source_type: doc.source_type, updated_at: doc.updated_at }
                  : d
              )
            : state.documents,
        })),

      removeDocument: (id) =>
        set((state) => {
          const details = { ...state.details };
          delete details[id];
          return {
            documents: state.documents.filter((d) => d.id !== id),
            details,
          };
        }),

      addOrUpdateDocument: (doc) =>
        set((state) => {
          const exists = state.documents.some((d) => d.id === doc.id);
          return {
            documents: exists
              ? state.documents.map((d) => (d.id === doc.id ? doc : d))
              : [doc, ...state.documents],
          };
        }),
    }),
    {
      name: 'library-store-v1',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      // Persist everything except runtime selector functions.
      partialize: ({ documents, details, lastFetched }) => ({
        documents,
        details,
        lastFetched,
      }),
    }
  )
);

export * as documentsRepo from './repos/documents.repo';
export * as bookmarksRepo from './repos/bookmarks.repo';
export * as readingHistoryRepo from './repos/reading-history.repo';
export * as profilesRepo from './repos/profiles.repo';
export * as searchRepo from './repos/search.repo';
export { getCurrentUserId, isSupabaseConfigured } from './supabase/client';

export type { DocumentCardDto, DocumentDetailDto } from './codecs/documents.codec';
export type { BookmarkDto } from './codecs/bookmarks.codec';
export type { ReadingHistoryDto } from './codecs/reading-history.codec';
export type { ProfileDto } from './codecs/profiles.codec';
export type { SearchResultDto } from './codecs/search.codec';

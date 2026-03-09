import { bookmarkSchema } from '../codecs/bookmarks.codec';
import { assertNoSupabaseError } from '../errors';
import { BOOKMARK_ROW_SELECT } from '../selects/bookmarks.select';
import { supabase } from '../supabase/client';
import { TABLE } from '../supabase/names';

export async function listBookmarks(documentId: string) {
  const { data, error } = await supabase
    .from(TABLE.bookmarks)
    .select(BOOKMARK_ROW_SELECT)
    .eq('document_id', documentId)
    .order('created_at', { ascending: true });

  assertNoSupabaseError('bookmarks.list', error);
  const rows = Array.isArray(data) ? data : [];
  return rows.map((row: unknown) => bookmarkSchema.parse(row));
}

export async function upsertBookmark(input: {
  userId: string;
  documentId: string;
  positionChars: number;
  note?: string | null;
}) {
  const { data, error } = await supabase
    .from(TABLE.bookmarks)
    .upsert(
      {
        user_id: input.userId,
        document_id: input.documentId,
        position_chars: input.positionChars,
        note: input.note ?? null,
      },
      { onConflict: 'user_id,document_id,position_chars' }
    )
    .select(BOOKMARK_ROW_SELECT)
    .single();

  assertNoSupabaseError('bookmarks.upsert', error);
  return bookmarkSchema.parse(data);
}

export async function deleteBookmark(id: string) {
  const { error } = await supabase.from(TABLE.bookmarks).delete().eq('id', id);
  assertNoSupabaseError('bookmarks.delete', error);
}

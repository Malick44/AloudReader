import { readingHistorySchema } from '../codecs/reading-history.codec';
import { assertNoSupabaseError } from '../errors';
import { upsertReadingHistoryRpc } from '../rpc';
import { READING_HISTORY_ROW_SELECT } from '../selects/reading-history.select';
import { supabase } from '../supabase/client';
import { TABLE } from '../supabase/names';

export async function getReadingHistory(documentId: string) {
  const { data, error } = await supabase
    .from(TABLE.readingHistory)
    .select(READING_HISTORY_ROW_SELECT)
    .eq('document_id', documentId)
    .maybeSingle();

  assertNoSupabaseError('readingHistory.get', error);
  return data ? readingHistorySchema.parse(data) : null;
}

export async function upsertReadingHistory(input: { documentId: string; progressChars: number }) {
  return upsertReadingHistoryRpc(input);
}

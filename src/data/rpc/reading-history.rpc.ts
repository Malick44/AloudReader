import { z } from 'zod';

import { assertNoSupabaseError } from '../errors';
import { readingHistorySchema } from '../codecs/reading-history.codec';
import { RPC } from '../supabase/names';
import { supabase } from '../supabase/client';

const upsertArgsSchema = z.object({
  documentId: z.string().min(1),
  progressChars: z.number().nonnegative(),
});

export async function upsertReadingHistoryRpc(args: { documentId: string; progressChars: number }) {
  const parsed = upsertArgsSchema.parse(args);
  const { data, error } = await supabase.rpc(RPC.upsertReadingHistory, {
    p_document_id: parsed.documentId,
    p_progress_chars: parsed.progressChars,
  });

  assertNoSupabaseError('readingHistory.rpc.upsert', error);
  return readingHistorySchema.parse(data);
}

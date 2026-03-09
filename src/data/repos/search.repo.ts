import { searchResultSchema } from '../codecs/search.codec';
import { assertNoSupabaseError } from '../errors';
import { applySearchSpec, SearchSpec } from '../queries/search.query';
import { SEARCH_DOCUMENT_SELECT } from '../selects/search.select';
import { supabase } from '../supabase/client';
import { TABLE } from '../supabase/names';

export async function searchDocuments(spec: SearchSpec) {
  const query = supabase.from(TABLE.documents).select(SEARCH_DOCUMENT_SELECT);
  const { data, error } = await applySearchSpec(query, spec).limit(50);
  assertNoSupabaseError('search.documents', error);
  const rows = Array.isArray(data) ? data : [];
  return rows.map((row: unknown) => searchResultSchema.parse(row));
}

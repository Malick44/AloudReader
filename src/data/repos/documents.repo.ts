import { documentCardSchema, documentDetailSchema } from '../codecs/documents.codec';
import { assertNoSupabaseError } from '../errors';
import { applyDocumentListSpec, DocumentListSpec } from '../queries/documents.query';
import {
  DOCUMENT_CARD_SELECT,
  DOCUMENT_DETAIL_SELECT,
} from '../selects/documents.select';
import { supabase } from '../supabase/client';
import { TABLE } from '../supabase/names';

export async function listDocuments(spec: DocumentListSpec = {}) {
  const query = supabase.from(TABLE.documents).select(DOCUMENT_CARD_SELECT);
  const { data, error } = await applyDocumentListSpec(query, spec);
  assertNoSupabaseError('documents.list', error);
  const rows = Array.isArray(data) ? data : [];
  return rows.map((row: unknown) => documentCardSchema.parse(row));
}

export async function getDocumentDetail(id: string) {
  const { data, error } = await supabase
    .from(TABLE.documents)
    .select(DOCUMENT_DETAIL_SELECT)
    .eq('id', id)
    .single();

  assertNoSupabaseError('documents.detail', error);
  return documentDetailSchema.parse(data);
}

export async function createDocument(input: {
  userId: string;
  title: string;
  body: string;
  language: string;
  sourceType: 'pdf' | 'article' | 'note';
}) {
  const { data, error } = await supabase
    .from(TABLE.documents)
    .insert({
      user_id: input.userId,
      title: input.title,
      body: input.body,
      language: input.language,
      source_type: input.sourceType,
    })
    .select(DOCUMENT_DETAIL_SELECT)
    .single();

  assertNoSupabaseError('documents.create', error);
  return documentDetailSchema.parse(data);
}

export async function deleteDocument(id: string) {
  const { error } = await supabase.from(TABLE.documents).delete().eq('id', id);
  assertNoSupabaseError('documents.delete', error);
}

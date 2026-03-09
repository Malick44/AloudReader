import { SupabaseQueryBuilder } from '../supabase/client';

export type DocumentListSpec = {
  q?: string;
  language?: string;
  sourceType?: 'pdf' | 'article' | 'note';
  sort?: 'updated_desc' | 'updated_asc';
};

type Builder = SupabaseQueryBuilder;

export function applyDocumentListSpec(builder: Builder, spec: DocumentListSpec): Builder {
  let query = builder;

  if (spec.q) {
    query = query.ilike('title', `%${spec.q}%`);
  }
  if (spec.language) {
    query = query.eq('language', spec.language);
  }
  if (spec.sourceType) {
    query = query.eq('source_type', spec.sourceType);
  }

  const ascending = spec.sort === 'updated_asc';
  query = query.order('updated_at', { ascending });
  return query;
}

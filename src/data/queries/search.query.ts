import { SupabaseQueryBuilder } from '../supabase/client';

export type SearchSpec = {
  q: string;
  language?: string;
};

type Builder = SupabaseQueryBuilder;

export function applySearchSpec(builder: Builder, spec: SearchSpec): Builder {
  let query = builder.ilike('title', `%${spec.q}%`);
  if (spec.language) {
    query = query.eq('language', spec.language);
  }
  return query;
}

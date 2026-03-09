import Constants from 'expo-constants';
import { createClient } from '@supabase/supabase-js';

import { Database } from './db.types';

type SupabaseErrorLike = { message: string } | null;
type SupabaseResultLike = { data: unknown; error: SupabaseErrorLike };

export type SupabaseQueryBuilder = PromiseLike<SupabaseResultLike> & {
  select: (columns: string) => SupabaseQueryBuilder;
  eq: (column: string, value: unknown) => SupabaseQueryBuilder;
  ilike: (column: string, pattern: string) => SupabaseQueryBuilder;
  order: (column: string, args: { ascending: boolean }) => SupabaseQueryBuilder;
  limit: (value: number) => SupabaseQueryBuilder;
  single: () => SupabaseQueryBuilder;
  maybeSingle: () => SupabaseQueryBuilder;
  insert: (values: unknown) => SupabaseQueryBuilder;
  update: (values: unknown) => SupabaseQueryBuilder;
  upsert: (values: unknown, options?: Record<string, unknown>) => SupabaseQueryBuilder;
  delete: () => SupabaseQueryBuilder;
};

type SupabaseClientLike = {
  from: (relation: string) => SupabaseQueryBuilder;
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<SupabaseResultLike>;
};

function optionalEnv(name: 'EXPO_PUBLIC_SUPABASE_URL' | 'EXPO_PUBLIC_SUPABASE_ANON_KEY'): string | null {
  const value = Constants.expoConfig?.extra?.[name] ?? process.env[name];
  return value && typeof value === 'string' ? value : null;
}

const supabaseUrl = optionalEnv('EXPO_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = optionalEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY');

/** True when Supabase credentials are present in the environment. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * A no-op stub that returns empty results for every query.
 * Used in offline / local-first mode when Supabase env vars are absent.
 */
const noopQueryBuilder: SupabaseQueryBuilder = new Proxy({} as SupabaseQueryBuilder, {
  get(_target, prop) {
    if (prop === 'then') {
      // Make it thenable so `await supabase.from(...).select(...)` resolves.
      return (resolve: (v: SupabaseResultLike) => void) =>
        resolve({ data: null, error: null });
    }
    // All chainable methods return the same proxy.
    return () => noopQueryBuilder;
  },
});

const noopClient: SupabaseClientLike = {
  from: (_relation) => noopQueryBuilder,
  rpc: async (_fn, _args) => ({ data: null, error: null }),
};

if (!isSupabaseConfigured) {
  console.warn(
    '[supabase] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY not set — ' +
      'running in offline/local-only mode. Remote data features are disabled.'
  );
}

const typedClient = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export const supabase = (typedClient ?? noopClient) as unknown as SupabaseClientLike;

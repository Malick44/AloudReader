# Data Access SDK

## Structure

- `src/data/supabase/*` for client and names
- `src/data/selects/*` for `.select(...)` strings
- `src/data/codecs/*` for Zod schemas and DTO typing
- `src/data/queries/*` for query spec and appliers
- `src/data/rpc/*` for typed RPC wrappers
- `src/data/repos/*` for domain operations
- `src/data/index.ts` for public feature-facing exports

## Rules

- UI/feature layers import from `src/data/index.ts` only.
- No `supabase.from()` or `.rpc()` calls outside `src/data/**`.
- No table/view/RPC string literals outside `src/data/supabase/names.ts`.
- No `.select("...")` strings outside `src/data/selects/**`.

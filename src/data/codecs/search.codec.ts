import { z } from 'zod';

export const searchResultSchema = z.object({
  id: z.string(),
  title: z.string(),
  language: z.string(),
  source_type: z.enum(['pdf', 'article', 'note']),
  updated_at: z.string(),
});

export type SearchResultDto = z.infer<typeof searchResultSchema>;

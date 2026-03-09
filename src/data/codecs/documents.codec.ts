import { z } from 'zod';

export const documentCardSchema = z.object({
  id: z.string(),
  title: z.string(),
  language: z.string(),
  source_type: z.enum(['pdf', 'article', 'note']),
  updated_at: z.string(),
});

export const documentDetailSchema = documentCardSchema.extend({
  body: z.string(),
  created_at: z.string(),
});

export type DocumentCardDto = z.infer<typeof documentCardSchema>;
export type DocumentDetailDto = z.infer<typeof documentDetailSchema>;

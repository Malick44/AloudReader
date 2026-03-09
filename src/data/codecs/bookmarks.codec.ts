import { z } from 'zod';

export const bookmarkSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  document_id: z.string(),
  position_chars: z.number(),
  note: z.string().nullable(),
  created_at: z.string(),
});

export type BookmarkDto = z.infer<typeof bookmarkSchema>;

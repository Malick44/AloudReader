import { z } from 'zod';

export const readingHistorySchema = z.object({
  id: z.string(),
  document_id: z.string(),
  progress_chars: z.number(),
  updated_at: z.string(),
});

export type ReadingHistoryDto = z.infer<typeof readingHistorySchema>;

import { z } from 'zod';

export const profileSchema = z.object({
  id: z.string(),
  display_name: z.string().nullable(),
  preferred_voice_model_id: z.string().nullable(),
  preferred_language: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type ProfileDto = z.infer<typeof profileSchema>;

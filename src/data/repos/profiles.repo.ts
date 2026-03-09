import { profileSchema } from '../codecs/profiles.codec';
import { assertNoSupabaseError } from '../errors';
import { PROFILE_ROW_SELECT } from '../selects/profiles.select';
import { supabase } from '../supabase/client';
import { TABLE } from '../supabase/names';

export async function getCurrentProfile(userId: string) {
  const { data, error } = await supabase.from(TABLE.profiles).select(PROFILE_ROW_SELECT).eq('id', userId).single();
  assertNoSupabaseError('profiles.getCurrent', error);
  return profileSchema.parse(data);
}

export async function updateProfilePreferences(
  userId: string,
  input: { preferredVoiceModelId?: string | null; preferredLanguage?: string }
) {
  const { data, error } = await supabase
    .from(TABLE.profiles)
    .update({
      preferred_voice_model_id: input.preferredVoiceModelId,
      preferred_language: input.preferredLanguage,
    })
    .eq('id', userId)
    .select(PROFILE_ROW_SELECT)
    .single();

  assertNoSupabaseError('profiles.updatePreferences', error);
  return profileSchema.parse(data);
}

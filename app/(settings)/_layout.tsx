import { Stack } from 'expo-router';

import { useAppTranslation } from '@/i18n/hooks';

export default function SettingsGroupLayout() {
    const { t } = useAppTranslation();

    return (
        <Stack screenOptions={{ headerShadowVisible: false }}>
            <Stack.Screen name="profile" options={{ title: t('settings.profile_title') }} />
            <Stack.Screen name="voices" options={{ title: t('settings.voices_title') }} />
            <Stack.Screen name="voices/[modelId]" options={{ title: '' }} />
            <Stack.Screen name="appearance" options={{ title: t('settings.appearance_title') }} />
            <Stack.Screen name="language" options={{ title: t('settings.language_title') }} />
            <Stack.Screen name="playback" options={{ title: t('settings.playback_title') }} />
            <Stack.Screen name="about" options={{ title: t('settings.about_title') }} />
        </Stack>
    );
}

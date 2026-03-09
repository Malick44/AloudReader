import { Stack } from 'expo-router';

import { useAppTranslation } from '@/i18n/hooks';

export default function LibraryGroupLayout() {
    const { t } = useAppTranslation();

    return (
        <Stack screenOptions={{ headerShadowVisible: false }}>
            <Stack.Screen name="[id]" options={{ title: t('library.title') }} />
            <Stack.Screen name="history" options={{ title: t('library.history_title') }} />
        </Stack>
    );
}

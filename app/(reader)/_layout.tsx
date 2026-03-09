import { Stack } from 'expo-router';

import { useAppTranslation } from '@/i18n/hooks';

export default function ReaderLayout() {
    const { t } = useAppTranslation();

    return (
        <Stack
            screenOptions={{
                headerShadowVisible: false,
                animation: 'slide_from_bottom',
                presentation: 'modal',
            }}
        >
            <Stack.Screen name="[id]" options={{ title: t('navigation.header_title') }} />
        </Stack>
    );
}

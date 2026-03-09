import { Stack } from 'expo-router';

import { useAppTranslation } from '@/i18n/hooks';

export default function AuthLayout() {
    const { t } = useAppTranslation();

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: 'fade',
            }}
        >
            <Stack.Screen name="welcome" />
            <Stack.Screen name="sign-in" />
            <Stack.Screen name="sign-up" />
            <Stack.Screen name="forgot-password" />
        </Stack>
    );
}

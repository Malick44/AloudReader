import { Stack } from 'expo-router';

import { useAppTranslation } from '@/i18n/hooks';

export default function AuthLayout() {
    const { t } = useAppTranslation();

    return (
        <Stack
            screenOptions={{
                headerShadowVisible: false,
                animation: 'fade',
            }}
        >
            <Stack.Screen name="welcome" options={{ headerShown: false }} />
            <Stack.Screen name="sign-in" options={{ title: t('auth.sign_in_title') }} />
            <Stack.Screen name="sign-up" options={{ title: t('auth.sign_up_title') }} />
            <Stack.Screen name="forgot-password" options={{ title: t('auth.forgot_password_title') }} />
        </Stack>
    );
}

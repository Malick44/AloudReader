import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '@/i18n';
import { useAppTranslation } from '@/i18n/hooks';
import { bootstrapDefaultModel } from '@/lib/tts';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { OfflineBanner } from '@/components/ui/OfflineBanner';

/**
 * Root layout — provides universal context and overlay components.
 * Navigation is handled by child route-group layouts:
 *   (auth)/   — sign-in / sign-up / welcome
 *   (tabs)/   — main app tabs
 *   (reader)/ — full-screen player
 */
export default function RootLayout() {
  const { t } = useAppTranslation();

  useEffect(() => {
    void bootstrapDefaultModel((status) => {
      console.log(`[tts-bootstrap] ${status}`);
    }).catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[tts-bootstrap] failed: ${message}`);
    });
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        {/* App route registration */}
        <Stack
          screenOptions={{
            headerTitle: t('navigation.header_title'),
            headerShadowVisible: false,
          }}
        >
          {/* Entry route */}
          <Stack.Screen name="index" options={{ title: t('navigation.home_title') }} />

          {/* Demo / dev screens */}
          <Stack.Screen name="tts-demo" options={{ title: t('navigation.tts_demo_title') }} />
          <Stack.Screen name="reader-demo" options={{ title: t('navigation.reader_demo_title') }} />
          <Stack.Screen name="benchmark" options={{ headerShown: false }} />
          <Stack.Screen name="physical-qa" options={{ headerShown: false }} />

          {/* New route groups — each group owns its own layout */}
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(reader)" options={{ headerShown: false }} />
          <Stack.Screen name="(library)" options={{ headerShown: false }} />
          <Stack.Screen name="(settings)" options={{ headerShown: false }} />
        </Stack>

        {/* Global overlay: offline status banner */}
        <OfflineBanner />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

import { Tabs } from 'expo-router';
import { View } from 'react-native';

import { useAppTranslation } from '@/i18n/hooks';
import { useThemeColors } from '@/theme/useThemeColors';
import { MiniPlayerBar } from '@/components/ui/MiniPlayerBar';
import { useReaderSessionStore } from '@/features/tts/reader-session-store';

export default function TabsLayout() {
    const { t } = useAppTranslation();
    const colors = useThemeColors();

    const { readerId, title, isPlaying, progress, setPlaying, clearSession } =
        useReaderSessionStore();

    return (
        <View style={{ flex: 1 }}>
            <Tabs
                screenOptions={{
                    headerShadowVisible: false,
                    tabBarActiveTintColor: colors.primary,
                    tabBarInactiveTintColor: colors.mutedForeground,
                    tabBarStyle: {
                        backgroundColor: colors.surface,
                        borderTopColor: colors.border,
                    },
                    headerStyle: { backgroundColor: colors.background },
                    headerTitleStyle: { color: colors.foreground },
                }}
            >
                <Tabs.Screen
                    name="index"
                    options={{ title: t('navigation.tab_library'), tabBarLabel: t('navigation.tab_library') }}
                />
                <Tabs.Screen
                    name="listen"
                    options={{ title: t('navigation.tab_listen'), tabBarLabel: t('navigation.tab_listen') }}
                />
                <Tabs.Screen
                    name="search"
                    options={{ title: t('navigation.tab_search'), tabBarLabel: t('navigation.tab_search') }}
                />
                <Tabs.Screen
                    name="settings"
                    options={{ title: t('navigation.tab_settings'), tabBarLabel: t('navigation.tab_settings') }}
                />
            </Tabs>

            {readerId && (
                <MiniPlayerBar
                    title={title}
                    isPlaying={isPlaying}
                    progress={progress}
                    readerId={readerId}
                    onPlayPause={() => setPlaying(!isPlaying)}
                    onStop={clearSession}
                />
            )}
        </View>
    );
}

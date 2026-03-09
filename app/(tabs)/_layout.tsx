import { useMemo } from 'react';
import { Tabs } from 'expo-router';
import { View } from 'react-native';

import { useAppTranslation } from '@/i18n/hooks';
import { useThemeColors } from '@/theme/useThemeColors';
import { MiniPlayerBar } from '@/components/ui/MiniPlayerBar';
import { createPipelinePlaybackController } from '@/lib/tts';
import { useReaderSessionStore } from '@/features/tts/reader-session-store';

export default function TabsLayout() {
    const { t } = useAppTranslation();
    const colors = useThemeColors();
    const playbackController = useMemo(() => createPipelinePlaybackController(), []);

    const { readerId, title, isPlaying, isPaused, progress, clearSession } =
        useReaderSessionStore();

    return (
        <View style={{ flex: 1 }}>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarActiveTintColor: colors.primary,
                    tabBarInactiveTintColor: colors.mutedForeground,
                    tabBarStyle: {
                        backgroundColor: colors.surface,
                        borderTopColor: colors.border,
                    },
                }}
            >
                <Tabs.Screen
                    name="index"
                    options={{ tabBarLabel: t('navigation.tab_library') }}
                />
                <Tabs.Screen
                    name="listen"
                    options={{ tabBarLabel: t('navigation.tab_listen') }}
                />
                <Tabs.Screen
                    name="search"
                    options={{ tabBarLabel: t('navigation.tab_search') }}
                />
                <Tabs.Screen
                    name="settings"
                    options={{ tabBarLabel: t('navigation.tab_settings') }}
                />
            </Tabs>

            {readerId && (
                <MiniPlayerBar
                    title={title}
                    isPlaying={isPlaying}
                    progress={progress}
                    readerId={readerId}
                    onPlayPause={() => {
                        if (isPlaying) {
                            playbackController.pause();
                            return;
                        }

                        if (isPaused) {
                            playbackController.resume();
                        }
                    }}
                    onStop={() => {
                        void playbackController.stop();
                        clearSession();
                    }}
                />
            )}
        </View>
    );
}

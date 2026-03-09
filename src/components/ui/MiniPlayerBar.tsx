import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTranslation } from '@/i18n/hooks';
import { useThemeColors } from '@/theme/useThemeColors';

interface MiniPlayerBarProps {
    title?: string;
    isPlaying: boolean;
    progress: number; // 0–100
    readerId: string;
    onPlayPause: () => void;
    onStop: () => void;
}

export function MiniPlayerBar({
    title,
    isPlaying,
    progress,
    readerId,
    onPlayPause,
    onStop,
}: MiniPlayerBarProps) {
    const colors = useThemeColors();
    const { t } = useAppTranslation();
    const router = useRouter();

    return (
        <Pressable
            style={[styles.container, { backgroundColor: colors.surface, borderTopColor: colors.border }]}
            onPress={() => router.push(`/(reader)/${readerId}`)}
            accessibilityRole="button"
            accessibilityLabel={t('miniplayer.open_reader')}
        >
            {/* Progress bar */}
            <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
                <View
                    style={[
                        styles.progressFill,
                        { backgroundColor: colors.primary, width: `${Math.min(progress, 100)}%` },
                    ]}
                />
            </View>

            <View style={styles.row}>
                <Text
                    style={[styles.title, { color: colors.foreground }]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                >
                    {title ?? t('miniplayer.default_title')}
                </Text>

                <View style={styles.controls}>
                    <Pressable
                        onPress={(e) => { e.stopPropagation(); onPlayPause(); }}
                        style={styles.btn}
                        accessibilityRole="button"
                        accessibilityLabel={isPlaying ? t('reader.pause_button') : t('reader.play_button')}
                        hitSlop={8}
                    >
                        <Text style={[styles.btnText, { color: colors.primary }]}>
                            {isPlaying ? '⏸' : '▶'}
                        </Text>
                    </Pressable>

                    <Pressable
                        onPress={(e) => { e.stopPropagation(); onStop(); }}
                        style={styles.btn}
                        accessibilityRole="button"
                        accessibilityLabel={t('reader.stop_button')}
                        hitSlop={8}
                    >
                        <Text style={[styles.btnText, { color: colors.mutedForeground }]}>{String.fromCharCode(0x23F9)}</Text>
                    </Pressable>
                </View>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        borderTopWidth: 1,
        paddingBottom: 4,
    },
    progressTrack: {
        height: 2,
        width: '100%',
    },
    progressFill: {
        height: 2,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 8,
    },
    title: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
    },
    controls: {
        flexDirection: 'row',
        gap: 12,
    },
    btn: {
        padding: 4,
    },
    btnText: {
        fontSize: 18,
    },
});

import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { Button } from '@/components/ui/Button';
import { useAppTranslation } from '@/i18n/hooks';
import { ResponsiveScrollView } from '@/shared/ui/layout';
import { useThemeColors } from '@/theme/useThemeColors';
import { spacingTokens as s } from '@/styles/tokens/spacing';
import { useTtsUiStore } from '@/features/tts/tts-store';

const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

export default function PlaybackScreen() {
    const { t } = useAppTranslation();
    const colors = useThemeColors();
    const router = useRouter();
    const { playbackRate, setPlaybackRate } = useTtsUiStore();

    return (
        <View style={[styles.screen, { backgroundColor: colors.background }]}>
            <AppHeader
                title={t('settings.playback_title')}
                leftActions={[{
                    node: <ArrowLeft size={22} color={colors.foreground} />,
                    onPress: router.back,
                    accessibilityLabel: 'Back',
                }]}
            />
            <ResponsiveScrollView style={styles.scrollFlex} innerStyle={styles.root} widthVariant="form">
                <Text style={[styles.heading, { color: colors.mutedForeground }]}>
                    {t('settings.playback_speed_label').toUpperCase()}
                </Text>

                <View style={styles.grid}>
                    {SPEED_OPTIONS.map((speed) => (
                        <View key={speed} style={styles.cell}>
                            <Button
                                label={`${speed}×`}
                                variant={playbackRate === speed ? 'secondary' : 'ghost'}
                                onPress={() => setPlaybackRate(speed)}
                            />
                        </View>
                    ))}
                </View>
            </ResponsiveScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1 },
    scrollFlex: { flex: 1 },
    root: { flex: 1, padding: s[5], gap: s[4] },
    heading: { fontSize: 11, fontWeight: '600', letterSpacing: 0.8 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: s[2] },
    cell: { minWidth: 72 },
});

import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { useAppTranslation } from '@/i18n/hooks';
import { useThemeColors } from '@/theme/useThemeColors';
import { spacingTokens as s } from '@/styles/tokens/spacing';
import { useTtsUiStore } from '@/features/tts/tts-store';

const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

/**
 * Default playback speed stored in the TTS UI store.
 * The reader screen reads this when building PipelineOptions.
 */
export default function PlaybackScreen() {
    const { t } = useAppTranslation();
    const colors = useThemeColors();

    const { playbackRate, setPlaybackRate } = useTtsUiStore();

    return (
        <View style={[styles.root, { backgroundColor: colors.background }]}>
            <Text style={[styles.heading, { color: colors.mutedForeground }]}>
                {t('settings.playback_speed_label').toUpperCase()}
            </Text>

            <View style={styles.grid}>
                {SPEED_OPTIONS.map((s_) => (
                    <View key={s_} style={styles.cell}>
                        <Button
                            label={`${s_}×`}
                            variant={playbackRate === s_ ? 'secondary' : 'ghost'}
                            onPress={() => setPlaybackRate(s_)}
                        />
                    </View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, padding: s[5], gap: s[4] },
    heading: { fontSize: 11, fontWeight: '600', letterSpacing: 0.8 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: s[2] },
    cell: { minWidth: 72 },
});

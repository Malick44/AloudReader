import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { useAppTranslation } from '@/i18n/hooks';
import { useThemeColors } from '@/theme/useThemeColors';
import { useThemeStore } from '@/theme/theme';
import { spacingTokens as s } from '@/styles/tokens/spacing';

export default function AppearanceScreen() {
    const { t } = useAppTranslation();
    const colors = useThemeColors();
    const { mode, setMode } = useThemeStore();

    const options: { label: string; value: 'light' | 'dark' | 'system' }[] = [
        { label: t('settings.theme_light'), value: 'light' },
        { label: t('settings.theme_dark'), value: 'dark' },
        { label: t('settings.theme_system'), value: 'system' },
    ];

    return (
        <View style={[styles.root, { backgroundColor: colors.background }]}>
            <Text style={[styles.heading, { color: colors.mutedForeground }]}>
                {t('settings.theme_label').toUpperCase()}
            </Text>

            {options.map((opt) => (
                <View key={opt.value} style={[styles.row, { borderBottomColor: colors.border }]}>
                    <Button
                        label={opt.label}
                        variant={mode === opt.value ? 'secondary' : 'ghost'}
                        onPress={() => setMode(opt.value)}
                    />
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, paddingTop: s[3] },
    heading: { fontSize: 11, fontWeight: '600', letterSpacing: 0.8, paddingHorizontal: s[5], paddingBottom: s[2] },
    row: { borderBottomWidth: StyleSheet.hairlineWidth },
});

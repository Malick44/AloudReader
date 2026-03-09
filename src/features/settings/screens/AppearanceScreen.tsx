import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { Button } from '@/components/ui/Button';
import { useAppTranslation } from '@/i18n/hooks';
import { ResponsiveScrollView } from '@/shared/ui/layout';
import { useThemeColors } from '@/theme/useThemeColors';
import { useThemeStore } from '@/theme/theme';
import { spacingTokens as s } from '@/styles/tokens/spacing';

export default function AppearanceScreen() {
    const { t } = useAppTranslation();
    const colors = useThemeColors();
    const router = useRouter();
    const { mode, setMode } = useThemeStore();

    const options: { label: string; value: 'light' | 'dark' | 'system' }[] = [
        { label: t('settings.theme_light'), value: 'light' },
        { label: t('settings.theme_dark'), value: 'dark' },
        { label: t('settings.theme_system'), value: 'system' },
    ];

    return (
        <View style={[styles.screen, { backgroundColor: colors.background }]}>
            <AppHeader
                title={t('settings.appearance_title')}
                leftActions={[{
                    node: <ArrowLeft size={22} color={colors.foreground} />,
                    onPress: router.back,
                    accessibilityLabel: 'Back',
                }]}
            />
            <ResponsiveScrollView style={styles.scrollFlex} innerStyle={styles.root} widthVariant="form">
                <Text style={[styles.heading, { color: colors.mutedForeground }]}>
                    {t('settings.theme_label').toUpperCase()}
                </Text>

                {options.map((option) => (
                    <View key={option.value} style={[styles.row, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
                        <Button
                            label={option.label}
                            variant={mode === option.value ? 'secondary' : 'ghost'}
                            onPress={() => setMode(option.value)}
                        />
                    </View>
                ))}
            </ResponsiveScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1 },
    scrollFlex: { flex: 1 },
    root: { flex: 1, paddingTop: s[3], gap: s[2] },
    heading: { fontSize: 11, fontWeight: '600', letterSpacing: 0.8, paddingBottom: s[2] },
    row: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, overflow: 'hidden' },
});

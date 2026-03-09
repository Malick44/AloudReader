import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import i18n, { resources, type SupportedLocale } from '@/i18n';

import { AppHeader } from '@/components/ui/AppHeader';
import { Button } from '@/components/ui/Button';
import { useAppTranslation } from '@/i18n/hooks';
import { ResponsiveScrollView } from '@/shared/ui/layout';
import { useThemeColors } from '@/theme/useThemeColors';
import { spacingTokens as s } from '@/styles/tokens/spacing';

const LOCALE_LABELS: Record<SupportedLocale, string> = {
    'en-US': 'English',
    'fr-FR': 'Français',
    'es-ES': 'Español',
    ar: 'العربية',
};

export default function LanguageScreen() {
    const { t } = useAppTranslation();
    const colors = useThemeColors();
    const router = useRouter();
    const current = i18n.language as SupportedLocale;

    const locales = Object.keys(resources) as SupportedLocale[];

    return (
        <View style={[styles.screen, { backgroundColor: colors.background }]}>
            <AppHeader
                title={t('settings.language_title')}
                leftActions={[{
                    node: <ArrowLeft size={22} color={colors.foreground} />,
                    onPress: router.back,
                    accessibilityLabel: 'Back',
                }]}
            />
            <ResponsiveScrollView style={styles.scrollFlex} innerStyle={styles.root} widthVariant="form">
                <Text style={[styles.heading, { color: colors.mutedForeground }]}>
                    {t('settings.language_label').toUpperCase()}
                </Text>

                {locales.map((locale) => (
                    <View key={locale} style={[styles.row, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
                        <Button
                            label={LOCALE_LABELS[locale]}
                            variant={current === locale ? 'secondary' : 'ghost'}
                            onPress={() => i18n.changeLanguage(locale)}
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

import { StyleSheet, Text, View } from 'react-native';
import i18n, { resources, type SupportedLocale } from '@/i18n';

import { Button } from '@/components/ui/Button';
import { useAppTranslation } from '@/i18n/hooks';
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
    const current = i18n.language as SupportedLocale;

    const locales = Object.keys(resources) as SupportedLocale[];

    return (
        <View style={[styles.root, { backgroundColor: colors.background }]}>
            <Text style={[styles.heading, { color: colors.mutedForeground }]}>
                {t('settings.language_label').toUpperCase()}
            </Text>

            {locales.map((locale) => (
                <View key={locale} style={[styles.row, { borderBottomColor: colors.border }]}>
                    <Button
                        label={LOCALE_LABELS[locale]}
                        variant={current === locale ? 'secondary' : 'ghost'}
                        onPress={() => i18n.changeLanguage(locale)}
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

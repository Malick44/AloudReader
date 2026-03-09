import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { useAppTranslation } from '@/i18n/hooks';
import { useThemeColors } from '@/theme/useThemeColors';
import { spacingTokens as s } from '@/styles/tokens/spacing';

export default function WelcomeScreen() {
    const { t } = useAppTranslation();
    const colors = useThemeColors();
    const router = useRouter();

    return (
        <View style={[styles.root, { backgroundColor: colors.background }]}>
            <View style={styles.hero}>
                <Text style={[styles.title, { color: colors.foreground }]}>
                    {t('auth.welcome_title')}
                </Text>
                <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                    {t('auth.welcome_subtitle')}
                </Text>
            </View>

            <View style={styles.cta}>
                <Button
                    label={t('auth.get_started')}
                    onPress={() => router.push('/(auth)/sign-up')}
                />
                <Button
                    label={t('auth.sign_in_title')}
                    variant="ghost"
                    onPress={() => router.push('/(auth)/sign-in')}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        justifyContent: 'space-between',
        paddingHorizontal: s[5],
        paddingBottom: s[10],
        paddingTop: s[16],
    },
    hero: {
        gap: s[3],
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        lineHeight: 40,
    },
    subtitle: {
        fontSize: 16,
        lineHeight: 24,
    },
    cta: {
        gap: s[3],
    },
});

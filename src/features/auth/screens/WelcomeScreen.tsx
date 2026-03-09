import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { useAppTranslation } from '@/i18n/hooks';
import { useResponsiveLayout } from '@/shared/responsive/useResponsiveLayout';
import { ResponsiveContent, ResponsiveTwoPane } from '@/shared/ui/layout';
import { useThemeColors } from '@/theme/useThemeColors';
import { spacingTokens as s } from '@/styles/tokens/spacing';

export default function WelcomeScreen() {
    const { t } = useAppTranslation();
    const colors = useThemeColors();
    const router = useRouter();
    const { sectionGap } = useResponsiveLayout();

    return (
        <View style={[styles.root, { backgroundColor: colors.background }]}>
            <ResponsiveContent style={styles.shell}>
                <ResponsiveTwoPane
                    style={styles.content}
                    primaryStyle={styles.heroPane}
                    secondaryStyle={[
                        styles.ctaPane,
                        {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                            gap: sectionGap,
                        },
                    ]}
                    primary={(
                        <View style={styles.hero}>
                            <Text style={[styles.title, { color: colors.foreground }]}>
                                {t('auth.welcome_title')}
                            </Text>
                            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                                {t('auth.welcome_subtitle')}
                            </Text>
                        </View>
                    )}
                    secondary={(
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
                    )}
                />
            </ResponsiveContent>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: s[4],
        paddingVertical: s[6],
    },
    shell: {
        flex: 1,
        justifyContent: 'center',
    },
    content: {
        justifyContent: 'space-between',
    },
    hero: {
        gap: s[3],
    },
    heroPane: {
        justifyContent: 'center',
        paddingVertical: s[8],
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
    ctaPane: {
        borderWidth: 1,
        borderRadius: 20,
        padding: s[5],
    },
    cta: {
        gap: s[3],
    },
});

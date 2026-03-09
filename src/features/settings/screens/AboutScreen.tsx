import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { useAppTranslation } from '@/i18n/hooks';
import { ResponsiveContent } from '@/shared/ui/layout';
import { useThemeColors } from '@/theme/useThemeColors';
import { spacingTokens as s } from '@/styles/tokens/spacing';

export default function AboutScreen() {
    const { t } = useAppTranslation();
    const colors = useThemeColors();
    const router = useRouter();

    const appVersion = Constants.expoConfig?.version ?? '1.0.0';

    return (
        <View style={[styles.root, { backgroundColor: colors.background }]}>
            <AppHeader
                title={t('settings.about_title')}
                leftActions={[{
                    node: <ArrowLeft size={22} color={colors.foreground} />,
                    onPress: router.back,
                    accessibilityLabel: 'Back',
                }]}
            />
            <View style={styles.content}>
                <ResponsiveContent widthVariant="form" style={styles.panel}>
                    <Text style={[styles.appName, { color: colors.foreground }]}>
                        {t('common.app_name')}
                    </Text>
                    <Text style={[styles.version, { color: colors.mutedForeground }]}>
                        {`v${appVersion}`}
                    </Text>
                    <Text style={[styles.desc, { color: colors.mutedForeground }]}>
                        {t('settings.about_description')}
                    </Text>
                </ResponsiveContent>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: s[5],
    },
    panel: {
        alignItems: 'center',
        gap: s[2],
    },
    appName: { fontSize: 24, fontWeight: '700' },
    version: { fontSize: 14 },
    desc: { fontSize: 14, textAlign: 'center', marginTop: s[2] },
});

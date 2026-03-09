import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { useAppTranslation } from '@/i18n/hooks';
import { ResponsiveContent } from '@/shared/ui/layout';
import { useThemeColors } from '@/theme/useThemeColors';
import { spacingTokens as s } from '@/styles/tokens/spacing';

export default function ProfileScreen() {
    const { t } = useAppTranslation();
    const colors = useThemeColors();
    const router = useRouter();

    return (
        <View style={[styles.root, { backgroundColor: colors.background }]}>
            <AppHeader
                title={t('settings.profile_title')}
                leftActions={[{
                    node: <ArrowLeft size={22} color={colors.foreground} />,
                    onPress: router.back,
                    accessibilityLabel: 'Back',
                }]}
            />
            <View style={styles.content}>
                <ResponsiveContent widthVariant="form" style={styles.panel}>
                    <Text style={[styles.placeholder, { color: colors.mutedForeground }]}>
                        {t('auth.profile_title')}
                    </Text>
                </ResponsiveContent>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: s[5] },
    panel: { alignItems: 'center' },
    placeholder: { fontSize: 16 },
});

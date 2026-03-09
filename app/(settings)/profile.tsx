import { StyleSheet, Text, View } from 'react-native';

import { useAppTranslation } from '@/i18n/hooks';
import { useThemeColors } from '@/theme/useThemeColors';
import { spacingTokens as s } from '@/styles/tokens/spacing';

export default function ProfileScreen() {
    const { t } = useAppTranslation();
    const colors = useThemeColors();

    return (
        <View style={[styles.root, { backgroundColor: colors.background }]}>
            <Text style={[styles.placeholder, { color: colors.mutedForeground }]}>
                {t('auth.profile_title')}
            </Text>
            {/* TODO: wire up Supabase auth user profile display + sign-out */}
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: s[5] },
    placeholder: { fontSize: 16 },
});

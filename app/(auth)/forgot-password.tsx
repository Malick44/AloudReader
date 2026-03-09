import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { useAppTranslation } from '@/i18n/hooks';
import { useThemeColors } from '@/theme/useThemeColors';
import { spacingTokens as s } from '@/styles/tokens/spacing';

export default function ForgotPasswordScreen() {
    const { t } = useAppTranslation();
    const colors = useThemeColors();

    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSend() {
        if (!email) return;
        setLoading(true);
        try {
            // Call supabase.auth.resetPasswordForEmail(email)
            setSent(true);
        } finally {
            setLoading(false);
        }
    }

    return (
        <View style={[styles.root, { backgroundColor: colors.background }]}>
            {sent ? (
                <Text style={[styles.sentMessage, { color: colors.foreground }]}>
                    {t('auth.forgot_password_sent')}
                </Text>
            ) : (
                <View style={styles.form}>
                    <Text style={[styles.label, { color: colors.mutedForeground }]}>{t('auth.email_label')}</Text>
                    <TextInput
                        style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.surface }]}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        placeholderTextColor={colors.mutedForeground}
                    />
                    <Button label={loading ? t('common.loading') : t('auth.forgot_password_button')} onPress={handleSend} />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        padding: s[5],
    },
    form: {
        gap: s[3],
        marginTop: s[5],
    },
    label: {
        fontSize: 13,
        marginBottom: -s[1],
    },
    input: {
        height: 44,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: s[3],
        fontSize: 15,
    },
    sentMessage: {
        fontSize: 16,
        lineHeight: 24,
        marginTop: s[10],
        textAlign: 'center',
    },
});

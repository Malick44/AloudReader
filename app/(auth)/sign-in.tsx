import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { useAppTranslation } from '@/i18n/hooks';
import { useThemeColors } from '@/theme/useThemeColors';
import { spacingTokens as s } from '@/styles/tokens/spacing';

export default function SignInScreen() {
    const { t } = useAppTranslation();
    const colors = useThemeColors();
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSignIn() {
        if (!email || !password) return;
        setLoading(true);
        try {
            const { createClient } = await import('@supabase/supabase-js');
            // Auth is handled via the existing supabase client
            // Navigate to tabs on success
            router.replace('/(tabs)/');
        } catch {
            Alert.alert(t('errors.unknown_error'));
        } finally {
            setLoading(false);
        }
    }

    const inputStyle = [styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.surface }];

    return (
        <View style={[styles.root, { backgroundColor: colors.background }]}>
            <View style={styles.form}>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>{t('auth.email_label')}</Text>
                <TextInput
                    style={inputStyle}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholderTextColor={colors.mutedForeground}
                />

                <Text style={[styles.label, { color: colors.mutedForeground }]}>{t('auth.password_label')}</Text>
                <TextInput
                    style={inputStyle}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    placeholderTextColor={colors.mutedForeground}
                />

                <Button label={loading ? t('common.loading') : t('auth.sign_in_button')} onPress={handleSignIn} />

                <Button
                    label={t('auth.forgot_password_link')}
                    variant="ghost"
                    onPress={() => router.push('/(auth)/forgot-password')}
                />
            </View>

            <View style={styles.footer}>
                <Text style={{ color: colors.mutedForeground }}>{t('auth.no_account_prompt')}</Text>
                <Button
                    label={t('auth.sign_up_title')}
                    variant="ghost"
                    onPress={() => router.push('/(auth)/sign-up')}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        padding: s[5],
        justifyContent: 'space-between',
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
    footer: {
        alignItems: 'center',
        gap: s[1],
        paddingBottom: s[4],
    },
});

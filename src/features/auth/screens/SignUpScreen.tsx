import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { Button } from '@/components/ui/Button';
import { useAppTranslation } from '@/i18n/hooks';
import { ResponsiveContent } from '@/shared/ui/layout';
import { useThemeColors } from '@/theme/useThemeColors';
import { spacingTokens as s } from '@/styles/tokens/spacing';

export default function SignUpScreen() {
    const { t } = useAppTranslation();
    const colors = useThemeColors();
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSignUp() {
        if (!email || !password) return;
        setLoading(true);
        try {
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
            <AppHeader
                title={t('auth.sign_up_title')}
                leftActions={[{
                    node: <ArrowLeft size={22} color={colors.foreground} />,
                    onPress: router.back,
                    accessibilityLabel: 'Back',
                }]}
            />
            <View style={styles.content}>
                <ResponsiveContent
                    widthVariant="form"
                    style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
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

                    <Button label={loading ? t('common.loading') : t('auth.sign_up_button')} onPress={handleSignUp} />
                </View>

                <View style={styles.footer}>
                    <Text style={{ color: colors.mutedForeground }}>{t('auth.have_account_prompt')}</Text>
                    <Button
                        label={t('auth.sign_in_title')}
                        variant="ghost"
                        onPress={() => router.push('/(auth)/sign-in')}
                    />
                </View>
                </ResponsiveContent>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    content: {
        flex: 1,
        padding: s[4],
        justifyContent: 'center',
    },
    card: {
        borderWidth: 1,
        borderRadius: 20,
        padding: s[5],
        gap: s[5],
    },
    form: {
        gap: s[3],
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
    },
});

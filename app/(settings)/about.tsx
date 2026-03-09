import { StyleSheet, Text, View } from 'react-native';

import { useAppTranslation } from '@/i18n/hooks';
import { useThemeColors } from '@/theme/useThemeColors';
import { spacingTokens as s } from '@/styles/tokens/spacing';

export default function AboutScreen() {
    const { t } = useAppTranslation();
    const colors = useThemeColors();

    const appVersion = '1.0.0'; // TODO: read from expo-constants

    return (
        <View style={[styles.root, { backgroundColor: colors.background }]}>
            <Text style={[styles.appName, { color: colors.foreground }]}>
                {t('common.app_name')}
            </Text>
            <Text style={[styles.version, { color: colors.mutedForeground }]}>
                v{appVersion}
            </Text>
            <Text style={[styles.desc, { color: colors.mutedForeground }]}>
                Offline-first text-to-speech powered by Sherpa-ONNX.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: s[5],
        gap: s[2],
    },
    appName: { fontSize: 24, fontWeight: '700' },
    version: { fontSize: 14 },
    desc: { fontSize: 14, textAlign: 'center', marginTop: s[2] },
});

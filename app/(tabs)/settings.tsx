import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAppTranslation } from '@/i18n/hooks';
import { useThemeColors } from '@/theme/useThemeColors';
import { spacingTokens as s } from '@/styles/tokens/spacing';

type SettingsRoute = {
    label: string;
    href: string;
};

export default function SettingsScreen() {
    const { t } = useAppTranslation();
    const colors = useThemeColors();
    const router = useRouter();

    const items: SettingsRoute[] = [
        { label: t('settings.profile_title'), href: '/(settings)/profile' },
        { label: t('settings.voices_title'), href: '/(settings)/voices' },
        { label: t('settings.appearance_title'), href: '/(settings)/appearance' },
        { label: t('settings.language_title'), href: '/(settings)/language' },
        { label: t('settings.playback_title'), href: '/(settings)/playback' },
        { label: t('settings.about_title'), href: '/(settings)/about' },
    ];

    return (
        <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.list}>
            {items.map((item) => (
                <Pressable
                    key={item.href}
                    style={[styles.row, { borderBottomColor: colors.border }]}
                    onPress={() => router.push(item.href as never)}
                >
                    <Text style={[styles.rowLabel, { color: colors.foreground }]}>{item.label}</Text>
                    <Text style={{ color: colors.mutedForeground }}>›</Text>
                </Pressable>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    list: { paddingTop: s[2] },
    row: {
        paddingHorizontal: s[5],
        paddingVertical: s[4],
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    rowLabel: { fontSize: 16 },
});

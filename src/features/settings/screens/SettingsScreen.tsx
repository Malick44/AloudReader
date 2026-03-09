import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { useAppTranslation } from '@/i18n/hooks';
import { useResponsiveLayout } from '@/shared/responsive/useResponsiveLayout';
import { ResponsiveScrollView } from '@/shared/ui/layout';
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
    const { settingsColumns } = useResponsiveLayout();

    const items: SettingsRoute[] = [
        { label: t('settings.profile_title'), href: '/(settings)/profile' },
        { label: t('settings.voices_title'), href: '/(settings)/voices' },
        { label: t('settings.appearance_title'), href: '/(settings)/appearance' },
        { label: t('settings.language_title'), href: '/(settings)/language' },
        { label: t('settings.playback_title'), href: '/(settings)/playback' },
        { label: t('settings.about_title'), href: '/(settings)/about' },
    ];

    return (
        <View style={[styles.root, { backgroundColor: colors.background }]}>
            <AppHeader title={t('navigation.tab_settings')} />
            <ResponsiveScrollView style={styles.scrollFlex} innerStyle={styles.list}>
                <View style={styles.grid}>
                    {items.map((item) => (
                        <Pressable
                            key={item.href}
                            style={[
                                styles.card,
                                settingsColumns > 1 && styles.gridCard,
                                { backgroundColor: colors.surface, borderColor: colors.border },
                            ]}
                            onPress={() => router.push(item.href as never)}
                        >
                            <Text style={[styles.rowLabel, { color: colors.foreground }]}>{item.label}</Text>
                            <Text style={{ color: colors.mutedForeground }}>{String.fromCharCode(0x203A)}</Text>
                        </Pressable>
                    ))}
                </View>
            </ResponsiveScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    scrollFlex: { flex: 1 },
    list: { paddingTop: s[2] },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: s[3],
    },
    card: {
        paddingHorizontal: s[5],
        paddingVertical: s[4],
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderRadius: 16,
    },
    gridCard: { width: '48%' },
    rowLabel: { fontSize: 16 },
});

import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { useAppTranslation } from '@/i18n/hooks';
import { useResponsiveLayout } from '@/shared/responsive/useResponsiveLayout';
import { ResponsiveScrollView } from '@/shared/ui/layout';
import { useThemeColors } from '@/theme/useThemeColors';
import { spacingTokens as s } from '@/styles/tokens/spacing';
import { type ModelCatalogEntry } from '@/lib/tts';
import { useTtsUiStore } from '@/features/tts/tts-store';

import { useVoiceCatalog } from '../hooks/useVoiceCatalog';

function VoiceRow({
    entry,
    isInstalled,
    isActive,
    onPress,
}: {
    entry: ModelCatalogEntry;
    isInstalled: boolean;
    isActive: boolean;
    onPress: () => void;
}) {
    const colors = useThemeColors();
    const { t } = useAppTranslation();

    return (
        <Pressable
            style={[styles.row, { borderBottomColor: colors.border }]}
            onPress={onPress}
            android_ripple={{ color: colors.muted }}
        >
            <View style={styles.rowText}>
                <Text style={[styles.label, { color: colors.foreground }]}>{entry.displayName}</Text>
                <Text style={[styles.sub, { color: colors.mutedForeground }]}>
                    {`${entry.language} · ${entry.family}`}
                </Text>
            </View>
            <View style={styles.rowRight}>
                {isActive && (
                    <View style={[styles.badge, { backgroundColor: colors.success ?? colors.primary }]}>
                        <Text style={[styles.badgeText, { color: colors.background }]}>
                            {t('settings.voice_active_badge')}
                        </Text>
                    </View>
                )}
                {isInstalled && !isActive && (
                    <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                        <Text style={[styles.badgeText, { color: colors.background }]}>
                            {t('settings.voice_installed_badge')}
                        </Text>
                    </View>
                )}
                <Text style={[styles.chevron, { color: colors.mutedForeground }]}>{String.fromCharCode(0x203A)}</Text>
            </View>
        </Pressable>
    );
}

export default function VoicesScreen() {
    const { t } = useAppTranslation();
    const colors = useThemeColors();
    const router = useRouter();
    const { selectedModelId } = useTtsUiStore();
    const { installedIds, installedEntries, availableEntries, loading } = useVoiceCatalog();
    const { settingsColumns } = useResponsiveLayout();

    const sections: { title: string; data: ModelCatalogEntry[] }[] = [
        {
            title: t('tts.installed_models_count', { count: installedEntries.length }),
            data: installedEntries,
        },
        {
            title: t('tts.model_catalog_title'),
            data: availableEntries,
        },
    ];

    return (
        <View style={[styles.screen, { backgroundColor: colors.background }]}>
            <AppHeader
                title={t('settings.voices_title')}
                leftActions={[{
                    node: <ArrowLeft size={22} color={colors.foreground} />,
                    onPress: router.back,
                    accessibilityLabel: 'Back',
                }]}
            />
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator color={colors.primary} />
                </View>
            ) : (
                <ResponsiveScrollView innerStyle={styles.list}>
                    {sections.map((section) => (
                        <View key={section.title}>
                            <Text style={[styles.sectionHeader, { color: colors.mutedForeground }]}>
                                {section.title}
                            </Text>
                            {section.data.length === 0 ? (
                                <Text style={[styles.empty, { color: colors.mutedForeground }]}>
                                    {t('settings.voices_section_empty')}
                                </Text>
                            ) : (
                                <View style={styles.grid}>
                                    {section.data.map((entry) => (
                                        <View key={entry.id} style={settingsColumns > 1 ? styles.gridCard : undefined}>
                                            <VoiceRow
                                                entry={entry}
                                                isInstalled={installedIds.has(entry.id)}
                                                isActive={entry.id === selectedModelId}
                                                onPress={() =>
                                                    router.push({
                                                        pathname: '/(settings)/voices/[modelId]',
                                                        params: { modelId: entry.id },
                                                    })
                                                }
                                            />
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    ))}
                </ResponsiveScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    list: { paddingBottom: s[8] },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: s[3] },
    gridCard: { width: '48%' },
    sectionHeader: {
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        paddingHorizontal: s[5],
        paddingTop: s[4],
        paddingBottom: s[1],
    },
    empty: {
        fontSize: 13,
        paddingHorizontal: s[5],
        paddingVertical: s[2],
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: s[5],
        paddingVertical: s[3],
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 16,
    },
    rowText: { flex: 1 },
    rowRight: { flexDirection: 'row', alignItems: 'center', gap: s[2] },
    label: { fontSize: 15 },
    sub: { fontSize: 12, marginTop: 2 },
    badge: {
        paddingHorizontal: s[2],
        paddingVertical: 2,
        borderRadius: 4,
    },
    badgeText: { fontSize: 10, fontWeight: '700' },
    chevron: { fontSize: 18, marginLeft: s[1] },
});

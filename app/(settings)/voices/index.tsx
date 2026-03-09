import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { useAppTranslation } from '@/i18n/hooks';
import { useThemeColors } from '@/theme/useThemeColors';
import { spacingTokens as s } from '@/styles/tokens/spacing';
import { listInstalledModels, localModelCatalog } from '@/lib/tts';
import type { InstalledModel, ModelCatalogEntry } from '@/lib/tts';
import { useTtsUiStore } from '@/features/tts/tts-store';

/** Only show catalog entries that have downloadable artifacts. */
const installableCatalog = localModelCatalog.filter(
    (m) => m.artifactUrls && Object.keys(m.artifactUrls).length > 0
);

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
                    {entry.language} · {entry.family}
                </Text>
            </View>
            <View style={styles.rowRight}>
                {isActive && (
                    <View style={[styles.badge, { backgroundColor: colors.success ?? '#22c55e' }]}>
                        <Text style={[styles.badgeText, { color: '#fff' }]}>
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
                <Text style={[styles.chevron, { color: colors.mutedForeground }]}>›</Text>
            </View>
        </Pressable>
    );
}

export default function VoicesScreen() {
    const { t } = useAppTranslation();
    const colors = useThemeColors();
    const router = useRouter();
    const { selectedModelId } = useTtsUiStore();

    const [installed, setInstalled] = useState<InstalledModel[]>([]);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(() => {
        setLoading(true);
        listInstalledModels()
            .then(setInstalled)
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    // Refresh every time this screen gains focus (e.g. returning from detail).
    useFocusEffect(refresh);

    const installedIds = new Set(installed.map((m) => m.modelId));
    const installedEntries = installableCatalog.filter((m) => installedIds.has(m.id));
    const availableEntries = installableCatalog.filter((m) => !installedIds.has(m.id));

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

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <ScrollView contentContainerStyle={styles.list}>
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
                            section.data.map((entry) => (
                                <VoiceRow
                                    key={entry.id}
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
                            ))
                        )}
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    list: { paddingBottom: s[8] },
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
        borderBottomWidth: StyleSheet.hairlineWidth,
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

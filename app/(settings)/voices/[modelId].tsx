import { useEffect, useState } from 'react';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { Button } from '@/components/ui/Button';
import { useAppTranslation } from '@/i18n/hooks';
import { useThemeColors } from '@/theme/useThemeColors';
import { spacingTokens as s } from '@/styles/tokens/spacing';
import {
    installFromCatalog,
    listInstalledModels,
    localModelCatalog,
    uninstallModel,
} from '@/lib/tts';
import { useTtsUiStore } from '@/features/tts/tts-store';

export default function VoiceDetailScreen() {
    const { t } = useAppTranslation();
    const colors = useThemeColors();
    const navigation = useNavigation();
    const { modelId } = useLocalSearchParams<{ modelId: string }>();

    const { selectedModelId, setSelectedModelId } = useTtsUiStore();
    const isActive = selectedModelId === modelId;

    const entry = localModelCatalog.find((m) => m.id === modelId);

    const [installed, setInstalled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [working, setWorking] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');

    useEffect(() => {
        if (!entry) { setLoading(false); return; }
        navigation.setOptions({ title: entry.displayName });
        listInstalledModels()
            .then((models) => setInstalled(models.some((m) => m.modelId === modelId)))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [modelId]);

    if (!entry) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background }]}>
                <Text style={{ color: colors.mutedForeground }}>{t('errors.unknown_error')}</Text>
            </View>
        );
    }

    const isInstallable =
        !!entry.artifactUrls && Object.keys(entry.artifactUrls).length > 0;

    async function handleInstall() {
        setWorking(true);
        setStatusMsg(t('settings.voice_downloading'));
        try {
            await installFromCatalog(modelId, (status) => {
                const labels: Record<string, string> = {
                    'downloading-espeak-data': t('settings.voice_status_downloading_espeak'),
                    'downloading-artifact': t('settings.voice_status_downloading'),
                    extracting: t('settings.voice_status_extracting'),
                    validating: t('settings.voice_status_validating'),
                    registering: t('settings.voice_status_registering'),
                };
                setStatusMsg(labels[status] ?? status);
            });
            setInstalled(true);
            setStatusMsg('');
            // Auto-select after install if nothing is selected yet
            if (!selectedModelId) setSelectedModelId(modelId);
        } catch (err) {
            setStatusMsg('');
            const msg = err instanceof Error ? err.message : t('errors.install_failed_generic');
            Alert.alert(t('errors.install_failed_generic'), msg);
        } finally {
            setWorking(false);
        }
    }

    async function handleUninstall() {
        Alert.alert(t('settings.voice_uninstall'), entry!.displayName, [
            { text: t('common.cancel'), style: 'cancel' },
            {
                text: t('settings.voice_uninstall'),
                style: 'destructive',
                onPress: async () => {
                    setWorking(true);
                    setStatusMsg(t('settings.voice_status_removing'));
                    try {
                        await uninstallModel(modelId);
                        setInstalled(false);
                        // Clear selection if this was the active voice
                        if (isActive) setSelectedModelId('');
                    } finally {
                        setWorking(false);
                        setStatusMsg('');
                    }
                },
            },
        ]);
    }

    return (
        <ScrollView
            style={{ backgroundColor: colors.background }}
            contentContainerStyle={styles.container}
        >
            {/* Header */}
            <Text style={[styles.title, { color: colors.foreground }]}>{entry.displayName}</Text>
            <Text style={[styles.meta, { color: colors.mutedForeground }]}>
                {entry.language} · {entry.family}
            </Text>

            {/* Status chips */}
            {!working && (
                <View style={styles.chips}>
                    {installed && (
                        <View style={[styles.chip, { backgroundColor: colors.primary }]}>
                            <Text style={[styles.chipText, { color: colors.background }]}>
                                {t('settings.voice_installed_badge')}
                            </Text>
                        </View>
                    )}
                    {isActive && (
                        <View style={[styles.chip, { backgroundColor: colors.success ?? colors.primary }]}>
                            <Text style={[styles.chipText, { color: colors.background }]}>
                                {t('settings.voice_active_badge')}
                            </Text>
                        </View>
                    )}
                </View>
            )}

            {/* Not installable notice */}
            {!isInstallable && (
                <Text style={[styles.notice, { color: colors.mutedForeground }]}>
                    {t('settings.voice_not_available')}
                </Text>
            )}

            {/* Action area */}
            {loading ? (
                <ActivityIndicator color={colors.primary} />
            ) : working ? (
                <View style={styles.workingArea}>
                    <ActivityIndicator color={colors.primary} />
                    {!!statusMsg && (
                        <Text style={[styles.statusText, { color: colors.mutedForeground }]}>
                            {statusMsg}
                        </Text>
                    )}
                </View>
            ) : isInstallable ? (
                <View style={styles.actions}>
                    {installed && !isActive && (
                        <Button
                            label={t('settings.voice_use_this')}
                            onPress={() => setSelectedModelId(modelId)}
                        />
                    )}
                    {!installed && (
                        <Button
                            label={t('settings.voice_install')}
                            onPress={handleInstall}
                        />
                    )}
                    {installed && (
                        <Button
                            label={t('settings.voice_uninstall')}
                            variant="destructive"
                            onPress={handleUninstall}
                        />
                    )}
                </View>
            ) : null}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: s[5], gap: s[4] },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    workingArea: { alignItems: 'center', gap: s[3] },
    actions: { gap: s[3] },
    title: { fontSize: 22, fontWeight: '700' },
    meta: { fontSize: 13 },
    chips: { flexDirection: 'row', gap: s[2], flexWrap: 'wrap' },
    chip: {
        paddingHorizontal: s[3],
        paddingVertical: s[1],
        borderRadius: 12,
    },
    chipText: { fontSize: 12, fontWeight: '700' },
    notice: { fontSize: 14, fontStyle: 'italic' },
    statusText: { fontSize: 13 },
});

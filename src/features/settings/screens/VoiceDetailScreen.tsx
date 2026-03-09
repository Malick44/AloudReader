import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { Button } from '@/components/ui/Button';
import { useAppTranslation } from '@/i18n/hooks';
import { ResponsiveScrollView, ResponsiveTwoPane } from '@/shared/ui/layout';
import { useThemeColors } from '@/theme/useThemeColors';
import { spacingTokens as s } from '@/styles/tokens/spacing';
import {
    bootstrapDefaultModel,
    installFromCatalog,
    listInstalledModels,
    localModelCatalog,
    uninstallModel,
} from '@/lib/tts';
import { useTtsUiStore } from '@/features/tts/tts-store';

export default function VoiceDetailScreen() {
    const { t } = useAppTranslation();
    const colors = useThemeColors();
    const router = useRouter();
    const { modelId } = useLocalSearchParams<{ modelId: string }>();

    const { selectedModelId, setSelectedModelId } = useTtsUiStore();
    const isActive = selectedModelId === modelId;

    const entry = localModelCatalog.find((model) => model.id === modelId);

    const [installed, setInstalled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [working, setWorking] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');

    useEffect(() => {
        let cancelled = false;

        if (!entry) {
            setLoading(false);
            return;
        }

        const updateInstalledState = async () => {
            const models = await listInstalledModels();
            if (!cancelled) {
                setInstalled(models.some((model) => model.modelId === modelId));
            }
        };

        void updateInstalledState()
            .catch(() => {
                if (!cancelled) {
                    setInstalled(false);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        void bootstrapDefaultModel()
            .then(updateInstalledState)
            .catch(() => undefined);

        return () => {
            cancelled = true;
        };
    }, [entry, modelId]);

    if (!entry) {
        return (
            <View style={[styles.screen, { backgroundColor: colors.background }]}>
                <AppHeader
                    title=""
                    leftActions={[{
                        node: <ArrowLeft size={22} color={colors.foreground} />,
                        onPress: router.back,
                        accessibilityLabel: 'Back',
                    }]}
                />
                <View style={styles.center}>
                    <Text style={{ color: colors.mutedForeground }}>{t('errors.unknown_error')}</Text>
                </View>
            </View>
        );
    }

    const entryDisplayName = entry.displayName;
    const isInstallable = !!entry.artifactUrls && Object.keys(entry.artifactUrls).length > 0;

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
            if (!selectedModelId) {
                setSelectedModelId(modelId);
            }
        } catch (error) {
            setStatusMsg('');
            const message = error instanceof Error ? error.message : t('errors.install_failed_generic');
            Alert.alert(t('errors.install_failed_generic'), message);
        } finally {
            setWorking(false);
        }
    }

    async function handleUninstall() {
        Alert.alert(t('settings.voice_uninstall'), entryDisplayName, [
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
                        if (isActive) {
                            setSelectedModelId('');
                        }
                    } finally {
                        setWorking(false);
                        setStatusMsg('');
                    }
                },
            },
        ]);
    }

    return (
        <View style={[styles.screen, { backgroundColor: colors.background }]}>
            <AppHeader
                title={entry.displayName}
                leftActions={[{
                    node: <ArrowLeft size={22} color={colors.foreground} />,
                    onPress: router.back,
                    accessibilityLabel: 'Back',
                }]}
            />
            <ResponsiveScrollView
                style={styles.scrollFlex}
                innerStyle={styles.container}
            >
                <ResponsiveTwoPane
                    primary={(
                        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Text style={[styles.title, { color: colors.foreground }]}>{entry.displayName}</Text>
                            <Text style={[styles.meta, { color: colors.mutedForeground }]}>
                                {`${entry.language} · ${entry.family}`}
                            </Text>

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

                            {!isInstallable && (
                                <Text style={[styles.notice, { color: colors.mutedForeground }]}>
                                    {t('settings.voice_not_available')}
                                </Text>
                            )}
                        </View>
                    )}
                    secondary={(
                        <View style={[styles.actionsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
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
                        </View>
                    )}
                />
            </ResponsiveScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1 },
    scrollFlex: { flex: 1 },
    container: { gap: s[4] },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    summaryCard: {
        borderWidth: 1,
        borderRadius: 20,
        padding: s[5],
        gap: s[4],
    },
    actionsCard: {
        borderWidth: 1,
        borderRadius: 20,
        padding: s[5],
        minHeight: 220,
        justifyContent: 'center',
    },
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

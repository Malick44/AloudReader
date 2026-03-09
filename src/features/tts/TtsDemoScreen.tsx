import { useAudioPlayer } from 'expo-audio';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useAppTranslation } from '@/i18n/hooks';
import {
  DetectedLanguage,
  getEngineStatus,
  initializeInstalledModel,
  initializeAudioSession,
  installFromCatalog,
  InstalledModel,
  listInstalledModels,
  localModelCatalog,
  resolveModelForText,
  synthesizeToFile,
  stop,
} from '@/lib/tts';
import { useThemeColors } from '@/theme/useThemeColors';

import { useTtsUiStore } from './tts-store';

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  return error instanceof Error ? error.message : fallbackMessage;
}

const DROPDOWN_CHEVRON = 'v';
const AUTO_ROUTE_DEFAULT = true;

export function TtsDemoScreen() {
  const [installedCount, setInstalledCount] = useState(0);
  const [installedModels, setInstalledModels] = useState<InstalledModel[]>([]);
  const [engineMessage, setEngineMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [autoRouteEnabled, setAutoRouteEnabled] = useState(AUTO_ROUTE_DEFAULT);
  const [modelPickerVisible, setModelPickerVisible] = useState(false);
  const colors = useThemeColors();
  const player = useAudioPlayer(null, {
    updateInterval: 100,
    keepAudioSessionActive: true,
  });
  const { t } = useAppTranslation();

  const selectedModelId = useTtsUiStore((state) => state.selectedModelId);
  const sampleText = useTtsUiStore((state) => state.sampleText);
  const statusMessage = useTtsUiStore((state) => state.statusMessage);
  const setSelectedModelId = useTtsUiStore((state) => state.setSelectedModelId);
  const setSampleText = useTtsUiStore((state) => state.setSampleText);
  const setStatusMessage = useTtsUiStore((state) => state.setStatusMessage);
  const selectedInstalledModel = useMemo(
    () => installedModels.find((entry) => entry.modelId === selectedModelId),
    [installedModels, selectedModelId]
  );

  const selectedModelLabel = selectedInstalledModel
    ? `${selectedInstalledModel.displayName} (${selectedInstalledModel.modelId})`
    : selectedModelId.trim() || t('tts.select_model_placeholder');

  const autoRouteButtonLabel = autoRouteEnabled
    ? t('tts.auto_route_toggle_on')
    : t('tts.auto_route_toggle_off');

  const detectedLanguageLabel = (detectedLanguage: DetectedLanguage): string => {
    if (detectedLanguage === 'unknown') {
      return t('tts.detected_language_unknown');
    }
    return detectedLanguage;
  };

  const resolveActiveModelId = (): {
    modelId: string;
    detectedLanguage?: DetectedLanguage;
    usedFallbackModel?: boolean;
  } => {
    if (!autoRouteEnabled) {
      return { modelId: selectedModelId };
    }

    const resolved = resolveModelForText({
      text: sampleText,
      installedModels,
      preferredModelId: selectedModelId,
    });

    if (!resolved.modelId) {
      throw new Error(t('tts.no_installed_models_hint'));
    }

    return {
      modelId: resolved.modelId,
      detectedLanguage: resolved.detectedLanguage,
      usedFallbackModel: resolved.usedFallbackModel,
    };
  };

  const refresh = async () => {
    const [installed, engine] = await Promise.all([listInstalledModels(), getEngineStatus()]);
    setInstalledModels(installed);
    setInstalledCount(installed.length);
    if (installed.length > 0 && !installed.some((entry) => entry.modelId === selectedModelId)) {
      setSelectedModelId(installed[0].modelId);
    }
    setEngineMessage(
      engine.message ??
        (engine.available ? t('tts.engine_available_status') : t('tts.engine_unavailable_status'))
    );
  };

  useEffect(() => {
    if (!sampleText.trim()) {
      setSampleText(t('tts.sample_default_text'));
    }
    if (!statusMessage.trim()) {
      setStatusMessage(t('common.idle'));
    }
  }, [sampleText, setSampleText, setStatusMessage, statusMessage, t]);

  useEffect(() => {
    void refresh();
  }, []);

  const installModel = async (modelId: string) => {
    setBusy(true);
    setStatusMessage(t('tts.installing_model_status'));
    try {
      await installFromCatalog(modelId, setStatusMessage);
      setSelectedModelId(modelId);
      setStatusMessage(t('tts.installed_model_status', { model_id: modelId }));
      await refresh();
    } catch (error) {
      setStatusMessage(getErrorMessage(error, t('errors.install_failed_generic')));
    } finally {
      setBusy(false);
    }
  };

  const initializeModel = async () => {
    setBusy(true);
    try {
      const resolved = resolveActiveModelId();
      if (resolved.modelId !== selectedModelId) {
        setSelectedModelId(resolved.modelId);
      }
      await initializeInstalledModel(resolved.modelId);
      if (resolved.detectedLanguage) {
        const language = detectedLanguageLabel(resolved.detectedLanguage);
        const statusKey = resolved.usedFallbackModel
          ? 'tts.auto_route_fallback_model_status'
          : 'tts.auto_route_selected_model_status';
        setStatusMessage(t(statusKey, { language, model_id: resolved.modelId }));
      } else {
        setStatusMessage(t('tts.initialized_model_status', { model_id: resolved.modelId }));
      }
    } catch (error) {
      setStatusMessage(getErrorMessage(error, t('errors.initialize_failed_generic')));
    } finally {
      setBusy(false);
    }
  };

  const runSpeak = async () => {
    setBusy(true);
    try {
      const resolved = resolveActiveModelId();
      if (resolved.modelId !== selectedModelId) {
        setSelectedModelId(resolved.modelId);
      }
      await initializeInstalledModel(resolved.modelId);
      await initializeAudioSession();
      const outputPath = await synthesizeToFile(sampleText, {
        modelId: resolved.modelId,
      });
      player.replace({ uri: outputPath });
      player.play();
      if (resolved.detectedLanguage) {
        const language = detectedLanguageLabel(resolved.detectedLanguage);
        const statusKey = resolved.usedFallbackModel
          ? 'tts.auto_route_fallback_playback_status'
          : 'tts.auto_route_playback_status';
        setStatusMessage(t(statusKey, { language, model_id: resolved.modelId }));
      } else {
        setStatusMessage(t('tts.local_playback_started_status', { model_id: resolved.modelId }));
      }
    } catch (error) {
      setStatusMessage(getErrorMessage(error, t('errors.speak_failed_generic')));
    } finally {
      setBusy(false);
    }
  };

  const runStop = async () => {
    setBusy(true);
    try {
      player.pause();
      await stop();
      setStatusMessage(t('tts.stop_completed_status'));
    } catch (error) {
      setStatusMessage(getErrorMessage(error, t('errors.playback_failed_generic')));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.contentContainer}>
        <Card>
          <Text style={[styles.heading, { color: colors.foreground }]}>{t('tts.engine_section_title')}</Text>
          <Text style={[styles.caption, { color: colors.mutedForeground }]}>
            {engineMessage || t('tts.engine_loading_status')}
          </Text>
          <Text style={[styles.captionMt, { color: colors.mutedForeground }]}>
            {t('tts.installed_models_count', { count: installedCount })}
          </Text>
        </Card>

        <Card>
          <Text style={[styles.heading, { color: colors.foreground }]}>{t('tts.model_catalog_title')}</Text>
          <View style={styles.buttonGroup}>
            {localModelCatalog.map((entry) => (
              <Button
                key={entry.id}
                label={t('tts.install_model_button', { name: entry.displayName })}
                variant="secondary"
                disabled={busy}
                onPress={() => installModel(entry.id)}
              />
            ))}
          </View>
        </Card>

        <Card>
          <Text style={[styles.heading, { color: colors.foreground }]}>{t('tts.selected_model_id_label')}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => setModelPickerVisible(true)}
            disabled={busy}
            style={[
              styles.dropdownTrigger,
              {
                borderColor: colors.input,
                backgroundColor: colors.surface,
                opacity: busy ? 0.7 : 1,
              },
            ]}
          >
            <Text
              style={[styles.dropdownValue, { color: colors.foreground }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {selectedModelLabel}
            </Text>
            <Text style={[styles.dropdownChevron, { color: colors.mutedForeground }]}>
              {DROPDOWN_CHEVRON}
            </Text>
          </Pressable>
          <Text style={[styles.captionMt, { color: colors.mutedForeground }]}>{selectedModelId}</Text>
          <Text style={[styles.headingMt, { color: colors.foreground }]}>{t('tts.sample_text_label')}</Text>
          <Input
            value={sampleText}
            onChangeText={setSampleText}
            multiline
            textAlignVertical="top"
            style={{ minHeight: 112 }}
          />
          <View style={styles.buttonGroupMt}>
            <Button
              label={autoRouteButtonLabel}
              variant="secondary"
              onPress={() => setAutoRouteEnabled((value) => !value)}
              disabled={busy}
            />
            <Button
              label={t('tts.initialize_installed_model_button')}
              onPress={initializeModel}
              disabled={busy}
            />
            <Button label={t('tts.speak_button')} onPress={runSpeak} disabled={busy} />
            <Button label={t('tts.stop_button')} variant="ghost" onPress={runStop} disabled={busy} />
          </View>
        </Card>

        <Card>
          <Text style={[styles.caption, { color: colors.mutedForeground }]}>
            {t('common.status_with_value', {
              label: t('common.status_prefix'),
              value: statusMessage || t('common.idle'),
            })}
          </Text>
        </Card>
      </ScrollView>

      <Modal
        transparent
        animationType="fade"
        visible={modelPickerVisible}
        onRequestClose={() => setModelPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setModelPickerVisible(false)}
            accessibilityRole="button"
          />
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {t('tts.model_picker_title')}
            </Text>
            {installedModels.length === 0 ? (
              <Text style={[styles.caption, { color: colors.mutedForeground }]}>
                {t('tts.no_installed_models_hint')}
              </Text>
            ) : (
              <ScrollView style={styles.modalList}>
                {installedModels.map((model) => {
                  const selected = model.modelId === selectedModelId;
                  return (
                    <Pressable
                      key={model.modelId}
                      onPress={() => {
                        setSelectedModelId(model.modelId);
                        setModelPickerVisible(false);
                      }}
                      style={[
                        styles.modalOption,
                        {
                          borderColor: colors.border,
                          backgroundColor: selected ? colors.accent : colors.surface,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.modalOptionTitle,
                          { color: selected ? colors.accentForeground : colors.foreground },
                        ]}
                      >
                        {model.displayName}
                      </Text>
                      <Text
                        style={[
                          styles.modalOptionSubtitle,
                          { color: selected ? colors.accentForeground : colors.mutedForeground },
                        ]}
                      >
                        {model.modelId}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { flex: 1 },
  contentContainer: { gap: 16, padding: 16 },
  heading: { marginBottom: 8, fontSize: 18, fontWeight: 'bold' },
  headingMt: { marginTop: 12, marginBottom: 8, fontSize: 18, fontWeight: 'bold' },
  caption: { fontSize: 14 },
  captionMt: { marginTop: 8, fontSize: 14 },
  dropdownTrigger: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 12,
  },
  dropdownChevron: { fontSize: 16, fontWeight: '700' },
  buttonGroup: { gap: 8 },
  buttonGroupMt: { marginTop: 12, gap: 8 },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalCard: {
    maxHeight: '70%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalList: { maxHeight: 420 },
  modalOption: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  modalOptionTitle: { fontSize: 15, fontWeight: '700' },
  modalOptionSubtitle: { marginTop: 4, fontSize: 12 },
});

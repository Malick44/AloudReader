import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useAppTranslation } from '@/i18n/hooks';
import {
  clearAudioCache,
  getAudioCacheStats,
  initializeInstalledModel,
  InstalledModel,
  listInstalledModels,
  LONG_FORM_QA_DEFAULT_TEXT,
  LongFormQaReport,
  runLongFormCacheQa,
} from '@/lib/tts';
import { useThemeColors } from '@/theme/useThemeColors';

const DEFAULT_CHUNK_SIZE = '420';
const DROPDOWN_CHEVRON = 'v';

function toBytesLabel(value: number): string {
  if (value >= 1024 * 1024) {
    return `${(value / (1024 * 1024)).toFixed(2)} MB`;
  }
  if (value >= 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }
  return `${value} B`;
}

function toSummaryLine(label: string, value: string | number): string {
  return `${label}: ${value}`;
}

export function PhysicalQaScreen() {
  const { t } = useAppTranslation();
  const colors = useThemeColors();
  const idleStatus = t('common.idle');
  const [installedModels, setInstalledModels] = useState<InstalledModel[]>([]);
  const [selectedModelId, setSelectedModelId] = useState('');
  const [status, setStatus] = useState(idleStatus);
  const [running, setRunning] = useState(false);
  const [chunkSizeText, setChunkSizeText] = useState(DEFAULT_CHUNK_SIZE);
  const [qaText, setQaText] = useState(LONG_FORM_QA_DEFAULT_TEXT);
  const [report, setReport] = useState<LongFormQaReport | null>(null);
  const [reportPath, setReportPath] = useState('');
  const [cacheSummary, setCacheSummary] = useState(t('physical_qa.cache_unknown'));
  const [modelPickerVisible, setModelPickerVisible] = useState(false);

  const selectedModel = useMemo(
    () => installedModels.find((entry) => entry.modelId === selectedModelId),
    [installedModels, selectedModelId]
  );

  const selectedModelLabel = selectedModel
    ? `${selectedModel.displayName} (${selectedModel.modelId})`
    : selectedModelId || t('physical_qa.select_model_placeholder');

  const refresh = async () => {
    const [models, cache] = await Promise.all([listInstalledModels(), getAudioCacheStats()]);
    setInstalledModels(models);
    setCacheSummary(
      t('physical_qa.cache_summary', {
        count: cache.fileCount,
        size: toBytesLabel(cache.totalBytes),
        directory: cache.directory,
      })
    );
    if (!selectedModelId && models.length > 0) {
      setSelectedModelId(models[0].modelId);
      return;
    }
    if (selectedModelId && !models.some((model) => model.modelId === selectedModelId) && models.length > 0) {
      setSelectedModelId(models[0].modelId);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const clearCache = async () => {
    setRunning(true);
    try {
      setStatus(t('physical_qa.status_clearing_cache'));
      await clearAudioCache();
      await refresh();
      setStatus(t('physical_qa.status_cache_cleared'));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : t('physical_qa.error_clear_cache'));
    } finally {
      setRunning(false);
    }
  };

  const runQa = async () => {
    if (!selectedModelId) {
      setStatus(t('physical_qa.status_no_model'));
      return;
    }

    const parsedChunkSize = Number.parseInt(chunkSizeText, 10);
    const chunkSize = Number.isFinite(parsedChunkSize) && parsedChunkSize > 0 ? parsedChunkSize : 420;

    setRunning(true);
    setReport(null);
    setReportPath('');
    try {
      setStatus(t('physical_qa.status_init_model', { modelId: selectedModelId }));
      await initializeInstalledModel(selectedModelId);

      const result = await runLongFormCacheQa({
        modelId: selectedModelId,
        text: qaText,
        chunkSize,
        clearCacheFirst: true,
        onStatus: setStatus,
      });

      setReport(result.report);
      setReportPath(result.reportPath);
      setStatus(t('physical_qa.status_complete'));
      await refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : t('physical_qa.error_failed'));
    } finally {
      setRunning(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Card>
          <Text style={[styles.title, { color: colors.foreground }]}>{t('physical_qa.title')}</Text>
          <Text style={[styles.caption, { color: colors.mutedForeground }]}>
            {t('physical_qa.subtitle')}
          </Text>
          <Text style={[styles.caption, { color: colors.mutedForeground }]}>{cacheSummary}</Text>
        </Card>

        <Card>
          <Text style={[styles.label, { color: colors.foreground }]}>{t('physical_qa.model_label')}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => setModelPickerVisible(true)}
            disabled={running}
            style={[
              styles.dropdownTrigger,
              {
                borderColor: colors.input,
                backgroundColor: colors.surface,
                opacity: running ? 0.7 : 1,
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

          <Text style={[styles.label, styles.labelTop, { color: colors.foreground }]}>
            {t('physical_qa.chunk_size_label')}
          </Text>
          <Input
            value={chunkSizeText}
            onChangeText={setChunkSizeText}
            keyboardType="number-pad"
            editable={!running}
          />

          <Text style={[styles.label, styles.labelTop, { color: colors.foreground }]}>
            {t('physical_qa.text_label')}
          </Text>
          <Input
            value={qaText}
            onChangeText={setQaText}
            multiline
            editable={!running}
            textAlignVertical="top"
            style={{ minHeight: 180 }}
          />

          <View style={styles.buttonGroup}>
            <Button
              label={t('physical_qa.refresh_button')}
              variant="secondary"
              disabled={running}
              onPress={() => void refresh()}
            />
            <Button
              label={t('physical_qa.clear_cache_button')}
              variant="ghost"
              disabled={running}
              onPress={() => void clearCache()}
            />
            <Button
              label={running ? t('physical_qa.running_button') : t('physical_qa.run_button')}
              disabled={running}
              onPress={() => void runQa()}
            />
          </View>
        </Card>

        <Card>
          <Text style={[styles.caption, { color: colors.foreground }]}>
            {toSummaryLine(t('physical_qa.status_prefix'), status || idleStatus)}
          </Text>
          {reportPath ? (
            <Text style={[styles.caption, { color: colors.mutedForeground }]}>
              {toSummaryLine(t('physical_qa.report_prefix'), reportPath)}
            </Text>
          ) : null}
        </Card>

        {report ? (
          <Card>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {t('physical_qa.summary_title')}
            </Text>
            <Text style={[styles.caption, { color: colors.foreground }]}>
              {toSummaryLine(t('physical_qa.summary_model'), report.modelId)}
            </Text>
            <Text style={[styles.caption, { color: colors.foreground }]}>
              {toSummaryLine(t('physical_qa.summary_text_chars'), report.textChars)}
            </Text>
            <Text style={[styles.caption, { color: colors.foreground }]}>
              {toSummaryLine(t('physical_qa.summary_chunk_count'), report.cold.chunkCount)}
            </Text>
            <Text style={[styles.caption, { color: colors.foreground }]}>
              {toSummaryLine(t('physical_qa.summary_cold_duration_ms'), report.cold.durationMs)}
            </Text>
            <Text style={[styles.caption, { color: colors.foreground }]}>
              {toSummaryLine(t('physical_qa.summary_warm_duration_ms'), report.warm.durationMs)}
            </Text>
            <Text style={[styles.caption, { color: colors.foreground }]}>
              {toSummaryLine(t('physical_qa.summary_warmup_gain_ms'), report.warmupGainMs)}
            </Text>
            <Text style={[styles.caption, { color: colors.foreground }]}>
              {toSummaryLine(
                t('physical_qa.summary_warmup_gain_pct'),
                report.warmupGainPercent.toFixed(1)
              )}
            </Text>
            <Text style={[styles.caption, { color: colors.foreground }]}>
              {toSummaryLine(t('physical_qa.summary_cold_cache_hits'), report.cold.cacheHitsBefore)}
            </Text>
            <Text style={[styles.caption, { color: colors.foreground }]}>
              {toSummaryLine(t('physical_qa.summary_warm_cache_hits'), report.warm.cacheHitsBefore)}
            </Text>
            <Text style={[styles.caption, { color: colors.foreground }]}>
              {toSummaryLine(t('physical_qa.summary_fallback_chunks'), report.warm.fallbackCount)}
            </Text>
            <Text style={[styles.caption, { color: colors.foreground }]}>
              {toSummaryLine(t('physical_qa.summary_failed_chunks'), report.warm.failureCount)}
            </Text>
          </Card>
        ) : null}
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
              {t('physical_qa.installed_models_title')}
            </Text>
            {installedModels.length === 0 ? (
              <Text style={[styles.caption, { color: colors.mutedForeground }]}>
                {t('physical_qa.no_models_hint')}
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
  content: { gap: 16, padding: 16 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  label: { fontSize: 15, fontWeight: '600' },
  labelTop: { marginTop: 12, marginBottom: 6 },
  caption: { fontSize: 14, marginBottom: 6 },
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
  buttonGroup: { marginTop: 12, gap: 8 },
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
  modalOptionTitle: { fontSize: 16, fontWeight: '600' },
  modalOptionSubtitle: { marginTop: 2, fontSize: 13 },
});

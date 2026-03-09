import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useAppTranslation } from '@/i18n/hooks';
import { DEFAULT_LANGUAGE, INITIAL_MODEL_ID } from '@/lib/tts/constants';
import { useThemeColors } from '@/theme/useThemeColors';

import { useLocalTtsReader } from './useLocalTtsReader';

function formatClock(seconds: number): string {
  const clamped = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const minutes = Math.floor(clamped / 60);
  const remainder = clamped % 60;
  return `${minutes}:${remainder.toString().padStart(2, '0')}`;
}

export function ReaderDemoScreen() {
  const { t } = useAppTranslation();
  const [modelId, setModelId] = useState(INITIAL_MODEL_ID);
  const [text, setText] = useState(() => t('reader.default_demo_text'));
  const reader = useLocalTtsReader();
  const colors = useThemeColors();
  const currentTime = formatClock(reader.playerStatus.currentTime);
  const duration = formatClock(reader.playerStatus.duration);

  const playbackStateLabel = reader.playerStatus.playing
    ? t('reader.playback_state_playing')
    : reader.isPaused
      ? t('reader.playback_state_paused')
      : t('reader.playback_state_idle');

  const prepare = async () => {
    await reader.prepare(text, {
      modelId,
      language: DEFAULT_LANGUAGE,
      fallbackToSystemTts: true,
      chunkSize: 380,
    });
  };

  const play = async () => {
    await reader.play({
      modelId,
      language: DEFAULT_LANGUAGE,
      fallbackToSystemTts: true,
      chunkSize: 380,
    });
  };

  const streamPlay = async () => {
    await reader.stream(text, {
      modelId,
      language: DEFAULT_LANGUAGE,
      fallbackToSystemTts: true,
      chunkSize: 380,
    });
  };

  const activeChunk = reader.activeChunk;
  const sourceText = reader.sourceText || text;
  const highlightedText = activeChunk
    ? {
        before: sourceText.slice(0, activeChunk.startChar),
        current: sourceText.slice(activeChunk.startChar, activeChunk.endChar),
        after: sourceText.slice(activeChunk.endChar),
      }
    : null;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.contentContainer}>
        <Card>
          <Text style={[styles.heading, { color: colors.foreground }]}>{t('reader.section_title')}</Text>
          <Text style={[styles.caption, { color: colors.mutedForeground }]}>
            {t('reader.progress_summary', {
              done: reader.progress,
              total: reader.total,
              pct: reader.progressPct,
            })}
          </Text>
          <Text style={[styles.captionMt, { color: colors.mutedForeground }]}>
            {t('reader.playback_time_summary', {
              state: playbackStateLabel,
              current: currentTime,
              duration,
            })}
          </Text>
        </Card>

        <Card>
          <Text style={[styles.label, { color: colors.foreground }]}>{t('reader.current_chunk_title')}</Text>
          {highlightedText ? (
            <Text style={[styles.caption, { color: colors.foreground }]}>
              <Text>{highlightedText.before}</Text>
              <Text style={{ backgroundColor: colors.accent, color: colors.accentForeground }}>
                {highlightedText.current}
              </Text>
              <Text>{highlightedText.after}</Text>
            </Text>
          ) : (
            <Text style={[styles.caption, { color: colors.mutedForeground }]}>
              {t('reader.current_chunk_empty')}
            </Text>
          )}
        </Card>

        <Card>
          <Text style={[styles.label, { color: colors.foreground }]}>{t('reader.model_id_label')}</Text>
          <Input value={modelId} onChangeText={setModelId} autoCapitalize="none" />
          <Text style={[styles.labelMt, { color: colors.foreground }]}>{t('reader.reader_text_label')}</Text>
          <Input value={text} onChangeText={setText} multiline textAlignVertical="top" style={{ minHeight: 176 }} />
          <View style={styles.buttonGroupMt}>
            <Button
              label={reader.isPreparing ? t('reader.streaming_button') : t('reader.stream_play_button')}
              onPress={streamPlay}
              disabled={reader.isPreparing || reader.isPlaying}
            />
            <Button
              label={reader.isPreparing ? t('reader.preparing_button') : t('reader.prepare_button')}
              onPress={prepare}
              disabled={reader.isPreparing || reader.isPlaying}
            />
            <Button
              label={reader.isPlaying ? t('reader.playing_button') : t('reader.play_button')}
              onPress={play}
              disabled={reader.isPreparing || reader.isPlaying || !reader.pipeline}
            />
            <Button
              label={reader.isPaused ? t('reader.resume_button') : t('reader.pause_button')}
              variant="secondary"
              onPress={reader.isPaused ? reader.resume : reader.pause}
              disabled={!reader.isPlaying}
            />
            <Button
              label={t('reader.skip_chunk_button')}
              variant="secondary"
              onPress={() => void reader.skipChunk()}
              disabled={!reader.isPlaying}
            />
            <Button
              label={t('reader.stop_button')}
              variant="ghost"
              onPress={() => void reader.stop()}
              disabled={!reader.isPlaying}
            />
          </View>
        </Card>

        {reader.errorMessage ? (
          <Card style={{ borderColor: colors.destructive }}>
            <Text style={[styles.caption, { color: colors.destructive }]}>{reader.errorMessage}</Text>
          </Card>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { flex: 1 },
  contentContainer: { gap: 16, padding: 16 },
  heading: { marginBottom: 8, fontSize: 18, fontWeight: 'bold' },
  caption: { fontSize: 14 },
  captionMt: { marginTop: 8, fontSize: 14 },
  label: { marginBottom: 8, fontSize: 14, fontWeight: '600' },
  labelMt: { marginTop: 12, marginBottom: 8, fontSize: 14, fontWeight: '600' },
  buttonGroupMt: { marginTop: 12, gap: 8 },
});

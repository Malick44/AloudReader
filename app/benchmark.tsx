import * as FileSystem from 'expo-file-system/legacy';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { initializeInstalledModel, listInstalledModels, synthesizeToFile } from '@/lib/tts';
import { useThemeColors } from '@/theme/useThemeColors';

type ModelBenchmarkRun = {
  iteration: number;
  latencyMs: number;
  sizeBytes: number;
  durationSec: number;
  realtimeFactor: number;
  outputPath: string;
};

type ModelBenchmarkResult = {
  modelId: string;
  runs: ModelBenchmarkRun[];
  avgLatencyMs: number;
  medianLatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  avgRealtimeFactor: number;
};

type BenchmarkReport = {
  createdAt: string;
  text: string;
  runsPerModel: number;
  results: ModelBenchmarkResult[];
};

const BENCHMARK_MODELS = ['en-us-ryan', 'en-us-lessac-high'] as const;
const BENCHMARK_TEXT =
  'This benchmark measures local synthesis latency and output pacing for side by side voice comparison in AloudReader.';
const RUNS_PER_MODEL = 5;
const SAMPLE_RATE = 22050;
const WAV_HEADER_BYTES = 44;
const IDLE_STATUS = 'Idle';
const COMPLETE_STATUS = 'Benchmark complete.';
const FAILED_STATUS = 'Benchmark failed.';
const TITLE_TEXT = 'Native TTS Benchmark';
const MODELS_LABEL = 'Models: en-us-ryan vs en-us-lessac-high';
const TEXT_PREFIX = 'Text:';
const RUNNING_LABEL = 'Running...';
const RUN_BENCHMARK_LABEL = 'Run Benchmark';
const STATUS_PREFIX = 'Status:';
const REPORT_PREFIX = 'Report:';
const AVG_LATENCY_PREFIX = 'Avg latency:';
const MEDIAN_LATENCY_PREFIX = 'Median latency:';
const MIN_MAX_LATENCY_PREFIX = 'Min/Max latency:';
const AVG_REALTIME_PREFIX = 'Avg realtime factor:';

function toStats(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const count = sorted.length;
  const avg = values.reduce((sum, value) => sum + value, 0) / count;
  const median =
    count % 2 === 1
      ? sorted[Math.floor(count / 2)]
      : (sorted[count / 2 - 1] + sorted[count / 2]) / 2;
  return {
    avg,
    median,
    min: sorted[0],
    max: sorted[sorted.length - 1],
  };
}

function estimateDurationFromSize(sizeBytes: number): number {
  const pcmBytes = Math.max(0, sizeBytes - WAV_HEADER_BYTES);
  return pcmBytes / (SAMPLE_RATE * 2);
}

async function writeReport(report: BenchmarkReport): Promise<string> {
  const outputDir = `${FileSystem.documentDirectory}tts/benchmarks`;
  await FileSystem.makeDirectoryAsync(outputDir, { intermediates: true });
  const outputPath = `${outputDir}/latest-native-benchmark.json`;
  await FileSystem.writeAsStringAsync(outputPath, JSON.stringify(report, null, 2));
  return outputPath;
}

function getFileSize(info: FileSystem.FileInfo): number {
  if (!info.exists || info.isDirectory) {
    return 0;
  }

  if ('size' in info && typeof info.size === 'number') {
    return info.size;
  }

  return 0;
}

async function runBenchmark(setStatus: (value: string) => void): Promise<{ report: BenchmarkReport; reportPath: string }> {
  const installed = await listInstalledModels();
  const installedIds = new Set(installed.map((entry) => entry.modelId));
  const missing = BENCHMARK_MODELS.filter((id) => !installedIds.has(id));
  if (missing.length > 0) {
    throw new Error(`Missing installed models: ${missing.join(', ')}`);
  }

  const modelResults: ModelBenchmarkResult[] = [];

  for (const modelId of BENCHMARK_MODELS) {
    setStatus(`Initializing ${modelId}...`);
    await initializeInstalledModel(modelId);

    setStatus(`Warming up ${modelId}...`);
    await synthesizeToFile(BENCHMARK_TEXT, {
      modelId,
      outputPath: `tts/benchmarks/${modelId}/warmup-${Date.now()}.wav`,
    });

    const runs: ModelBenchmarkRun[] = [];
    for (let iteration = 1; iteration <= RUNS_PER_MODEL; iteration += 1) {
      setStatus(`Running ${modelId} iteration ${iteration}/${RUNS_PER_MODEL}...`);
      const startedAt = Date.now();
      const outputPath = await synthesizeToFile(BENCHMARK_TEXT, {
        modelId,
        outputPath: `tts/benchmarks/${modelId}/run-${Date.now()}-${iteration}.wav`,
      });
      const elapsed = Date.now() - startedAt;
      const info = await FileSystem.getInfoAsync(outputPath);
      const sizeBytes = getFileSize(info);
      const durationSec = estimateDurationFromSize(sizeBytes);
      const realtimeFactor = durationSec > 0 ? elapsed / (durationSec * 1000) : 0;

      runs.push({
        iteration,
        latencyMs: elapsed,
        sizeBytes,
        durationSec,
        realtimeFactor,
        outputPath,
      });
    }

    const latencyStats = toStats(runs.map((run) => run.latencyMs));
    const rtfStats = toStats(runs.map((run) => run.realtimeFactor));

    modelResults.push({
      modelId,
      runs,
      avgLatencyMs: latencyStats.avg,
      medianLatencyMs: latencyStats.median,
      minLatencyMs: latencyStats.min,
      maxLatencyMs: latencyStats.max,
      avgRealtimeFactor: rtfStats.avg,
    });
  }

  const report: BenchmarkReport = {
    createdAt: new Date().toISOString(),
    text: BENCHMARK_TEXT,
    runsPerModel: RUNS_PER_MODEL,
    results: modelResults,
  };

  const reportPath = await writeReport(report);
  return { report, reportPath };
}

export default function BenchmarkRoute() {
  const colors = useThemeColors();
  const [status, setStatus] = useState(IDLE_STATUS);
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState<BenchmarkReport | null>(null);
  const [reportPath, setReportPath] = useState<string>('');

  const run = async () => {
    setRunning(true);
    setReport(null);
    setReportPath('');
    try {
      const result = await runBenchmark(setStatus);
      setReport(result.report);
      setReportPath(result.reportPath);
      setStatus(COMPLETE_STATUS);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : FAILED_STATUS);
    } finally {
      setRunning(false);
    }
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <AppHeader title={TITLE_TEXT} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Card>
          <Text style={[styles.title, { color: colors.foreground }]}>{TITLE_TEXT}</Text>
          <Text style={[styles.caption, { color: colors.mutedForeground }]}>{MODELS_LABEL}</Text>
          <Text style={[styles.caption, { color: colors.mutedForeground }]}>{`${TEXT_PREFIX} ${BENCHMARK_TEXT}`}</Text>
          <View style={styles.buttonArea}>
            <Button label={running ? RUNNING_LABEL : RUN_BENCHMARK_LABEL} onPress={run} disabled={running} />
          </View>
          <Text style={[styles.caption, { color: colors.foreground }]}>{`${STATUS_PREFIX} ${status}`}</Text>
          {reportPath ? (
            <Text style={[styles.caption, { color: colors.mutedForeground }]}>{`${REPORT_PREFIX} ${reportPath}`}</Text>
          ) : null}
        </Card>

        {report
          ? report.results.map((result) => (
              <Card key={result.modelId}>
                <Text style={[styles.title, { color: colors.foreground }]}>{result.modelId}</Text>
                <Text style={[styles.caption, { color: colors.foreground }]}>
                  {`${AVG_LATENCY_PREFIX} ${result.avgLatencyMs.toFixed(1)} ms`}
                </Text>
                <Text style={[styles.caption, { color: colors.foreground }]}>
                  {`${MEDIAN_LATENCY_PREFIX} ${result.medianLatencyMs.toFixed(1)} ms`}
                </Text>
                <Text style={[styles.caption, { color: colors.foreground }]}>
                  {`${MIN_MAX_LATENCY_PREFIX} ${result.minLatencyMs.toFixed(1)} / ${result.maxLatencyMs.toFixed(1)} ms`}
                </Text>
                <Text style={[styles.caption, { color: colors.foreground }]}>
                  {`${AVG_REALTIME_PREFIX} ${result.avgRealtimeFactor.toFixed(3)}`}
                </Text>
              </Card>
            ))
          : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { flex: 1 },
  content: { gap: 16, padding: 16 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  caption: { fontSize: 14, marginBottom: 6 },
  buttonArea: { marginVertical: 8 },
});

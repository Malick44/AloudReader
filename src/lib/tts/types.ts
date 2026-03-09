export type TtsModelFamily = 'piper' | 'kokoro' | 'vits' | 'matcha';

export type TtsAssetPaths = {
  modelPath: string;
  tokensPath?: string;
  dataDirPath?: string;
  lexiconPath?: string;
  ruleFstsPaths?: string[];
  configPath?: string;
  voicesPath?: string;
};

export type TtsModelConfig = {
  id: string;
  family: TtsModelFamily;
  language: string;
  displayName: string;
  sampleRate: number;
  assets: TtsAssetPaths;
  installDir: string;
};

export type SpeakOptions = {
  modelId?: string;
  language?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  fallbackToSystemTts?: boolean;
};

export type SynthesizeOptions = {
  modelId: string;
  outputPath?: string;
  speed?: number;
  speakerId?: number;
  language?: string;
  fallbackToSystemTts?: boolean;
};

export type InstalledModel = {
  modelId: string;
  family: TtsModelFamily;
  language: string;
  displayName: string;
  installDir: string;
  installedAt: string;
  sizeBytes: number;
  config: TtsModelConfig;
};

export type EngineStatus = {
  backend: 'sherpa-onnx-local-module';
  available: boolean;
  initializedModelIds: string[];
  message?: string;
};

export type ModelCatalogEntry = {
  id: string;
  family: TtsModelFamily;
  language: string;
  displayName: string;
  archiveUrl?: string;
  localArchivePath?: string;
  artifactUrls?: Record<string, string>;
  artifactChecksumsSha256?: Record<string, string>;
  checksumSha256?: string;
};

export type ChunkMetadata = {
  id: string;
  index: number;
  text: string;
  paragraphIndex: number;
  startChar: number;
  endChar: number;
};

export type ChunkerOptions = {
  maxChunkChars?: number;
  minChunkChars?: number;
};

export type PipelineOptions = {
  modelId: string;
  language?: string;
  chunkSize?: number;
  fallbackToSystemTts?: boolean;
  rate?: number;
  pitch?: number;
};

export type PipelineChunkResult = {
  chunk: ChunkMetadata;
  cacheKey: string;
  audioPath?: string;
  usedFallback: boolean;
  errorMessage?: string;
};

export type PipelineResult = {
  modelId: string;
  chunks: PipelineChunkResult[];
};

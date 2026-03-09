export type NativeTtsModelFamily = 'piper' | 'kokoro' | 'vits' | 'matcha';

export type NativeTtsAssetPaths = {
  modelPath: string;
  tokensPath?: string;
  dataDirPath?: string;
  lexiconPath?: string;
  ruleFstsPaths?: string[];
  configPath?: string;
  voicesPath?: string;
};

export type NativeTtsModelConfig = {
  id: string;
  family: NativeTtsModelFamily;
  language: string;
  displayName: string;
  sampleRate: number;
  installDir: string;
  assets: NativeTtsAssetPaths;
};

export type NativeSynthesizeOptions = {
  modelId: string;
  outputPath?: string;
  speed?: number;
  speakerId?: number;
  language?: string;
};

export type NativeSpeakOptions = {
  modelId?: string;
  language?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
};

export type NativeInstalledModel = {
  modelId: string;
  family: NativeTtsModelFamily;
  language: string;
  displayName: string;
  installDir: string;
  initializedAt: string;
};

export type EngineStatusNative = {
  available: boolean;
  initializedModelIds: string[];
  message?: string;
};

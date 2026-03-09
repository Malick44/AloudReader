import { registerWebModule, NativeModule } from 'expo';

import {
  EngineStatusNative,
  NativeInstalledModel,
  NativeSpeakOptions,
  NativeSynthesizeOptions,
  NativeTtsModelConfig,
} from './ExpoLocalTts.types';

class ExpoLocalTtsModule extends NativeModule {
  private initializedModelIds = new Set<string>();

  async initialize(config: NativeTtsModelConfig): Promise<void> {
    this.initializedModelIds.add(config.id);
  }

  async preloadModels(configs: NativeTtsModelConfig[]): Promise<void> {
    configs.forEach((config) => this.initializedModelIds.add(config.id));
  }

  async synthesizeToFile(text: string, options: NativeSynthesizeOptions): Promise<string> {
    void text;
    void options;
    throw new Error('Sherpa-ONNX native synthesis is not available on web.');
  }

  async speak(text: string, options: NativeSpeakOptions): Promise<void> {
    void text;
    void options;
    throw new Error('Native local TTS speak() is unavailable on web.');
  }

  async stop(): Promise<void> {
    return Promise.resolve();
  }

  async isReady(modelId: string): Promise<boolean> {
    return this.initializedModelIds.has(modelId);
  }

  async listInstalledModels(): Promise<NativeInstalledModel[]> {
    return [];
  }

  async uninstallModel(modelId: string): Promise<void> {
    this.initializedModelIds.delete(modelId);
  }

  async getEngineStatus(): Promise<EngineStatusNative> {
    return {
      available: false,
      initializedModelIds: Array.from(this.initializedModelIds),
      message: 'Web runtime does not support the local Sherpa-ONNX module.',
    };
  }
}

export default registerWebModule(ExpoLocalTtsModule, 'ExpoLocalTts');

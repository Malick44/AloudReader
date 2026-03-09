import { NativeModule, requireNativeModule } from 'expo';

import {
  EngineStatusNative,
  NativeInstalledModel,
  NativeSpeakOptions,
  NativeSynthesizeOptions,
  NativeTtsModelConfig,
} from './ExpoLocalTts.types';

declare class ExpoLocalTtsModule extends NativeModule {
  initialize(config: NativeTtsModelConfig): Promise<void>;
  preloadModels(configs: NativeTtsModelConfig[]): Promise<void>;
  synthesizeToFile(text: string, options: NativeSynthesizeOptions): Promise<string>;
  speak(text: string, options: NativeSpeakOptions): Promise<void>;
  stop(): Promise<void>;
  isReady(modelId: string): Promise<boolean>;
  listInstalledModels(): Promise<NativeInstalledModel[]>;
  uninstallModel(modelId: string): Promise<void>;
  getEngineStatus(): Promise<EngineStatusNative>;
}

const UNAVAILABLE_MESSAGE =
  'ExpoLocalTts native module is unavailable. Rebuild and launch a development build (npx expo run:android or npx expo run:ios). Expo Go is not supported for local TTS.';

function createUnavailableModule(): ExpoLocalTtsModule {
  const rejectUnavailable = <T>(): Promise<T> => Promise.reject(new Error(UNAVAILABLE_MESSAGE));

  return {
    initialize: () => rejectUnavailable<void>(),
    preloadModels: () => rejectUnavailable<void>(),
    synthesizeToFile: () => rejectUnavailable<string>(),
    speak: () => rejectUnavailable<void>(),
    stop: () => rejectUnavailable<void>(),
    isReady: () => rejectUnavailable<boolean>(),
    listInstalledModels: () => rejectUnavailable<NativeInstalledModel[]>(),
    uninstallModel: () => rejectUnavailable<void>(),
    getEngineStatus: () => rejectUnavailable<EngineStatusNative>(),
  } as unknown as ExpoLocalTtsModule;
}

let ExpoLocalTts: ExpoLocalTtsModule;

try {
  ExpoLocalTts = requireNativeModule<ExpoLocalTtsModule>('ExpoLocalTts');
} catch {
  ExpoLocalTts = createUnavailableModule();
}

export default ExpoLocalTts;

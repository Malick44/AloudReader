import { ensureTtsLayout, getRegistryFilePath } from './file-layout';
import { TtsError, asTtsError } from './errors';
import { pathExists, readJsonFile, writeJsonAtomic } from './path-utils';
import { InstalledModel } from './types';

type RegistryShape = {
  version: number;
  installedModels: InstalledModel[];
};

const EMPTY_REGISTRY: RegistryShape = {
  version: 1,
  installedModels: [],
};

let operationQueue: Promise<void> = Promise.resolve();

function queueOp<T>(work: () => Promise<T>): Promise<T> {
  const result = operationQueue.then(work, work);
  operationQueue = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

async function readRegistry(): Promise<RegistryShape> {
  await ensureTtsLayout();
  const path = getRegistryFilePath();
  const exists = await pathExists(path);
  if (!exists) {
    await writeJsonAtomic(path, EMPTY_REGISTRY);
    return EMPTY_REGISTRY;
  }
  return readJsonFile(path, EMPTY_REGISTRY);
}

async function writeRegistry(registry: RegistryShape): Promise<void> {
  const path = getRegistryFilePath();
  await writeJsonAtomic(path, registry);
}

export async function listInstalledModelsFromRegistry(): Promise<InstalledModel[]> {
  const registry = await readRegistry();
  return registry.installedModels;
}

export async function getInstalledModel(modelId: string): Promise<InstalledModel | undefined> {
  const registry = await readRegistry();
  return registry.installedModels.find((model) => model.modelId === modelId);
}

export async function upsertInstalledModel(model: InstalledModel): Promise<void> {
  await queueOp(async () => {
    try {
      const registry = await readRegistry();
      const next = registry.installedModels.filter((entry) => entry.modelId !== model.modelId);
      next.push(model);
      await writeRegistry({ ...registry, installedModels: next });
    } catch (error) {
      throw asTtsError(error, 'REGISTRY_FAILED', 'Failed to upsert model registry entry.', {
        modelId: model.modelId,
      });
    }
  });
}

export async function removeInstalledModelFromRegistry(modelId: string): Promise<void> {
  await queueOp(async () => {
    const registry = await readRegistry();
    const exists = registry.installedModels.some((entry) => entry.modelId === modelId);
    if (!exists) {
      throw new TtsError('MODEL_NOT_FOUND', `Model is not installed: ${modelId}`);
    }

    const next = registry.installedModels.filter((entry) => entry.modelId !== modelId);
    await writeRegistry({ ...registry, installedModels: next });
  });
}

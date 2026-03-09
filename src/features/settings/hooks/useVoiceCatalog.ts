import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import {
    bootstrapDefaultModel,
    listInstalledModels,
    localModelCatalog,
    type InstalledModel,
    type ModelCatalogEntry,
} from '@/lib/tts';

const installableCatalog = localModelCatalog.filter(
    (model) => model.artifactUrls && Object.keys(model.artifactUrls).length > 0
);

export function useVoiceCatalog() {
    const [installed, setInstalled] = useState<InstalledModel[]>([]);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(() => {
        setLoading(true);
        listInstalledModels()
            .then(setInstalled)
            .catch(() => {
                setInstalled([]);
            })
            .finally(() => setLoading(false));
    }, []);

    useFocusEffect(
        useCallback(() => {
            refresh();

            void bootstrapDefaultModel()
                .catch(() => undefined)
                .finally(refresh);
        }, [refresh])
    );

    const installedIds = useMemo(() => new Set(installed.map((model) => model.modelId)), [installed]);
    const installedEntries = useMemo<ModelCatalogEntry[]>(
        () => installableCatalog.filter((model) => installedIds.has(model.id)),
        [installedIds]
    );
    const availableEntries = useMemo<ModelCatalogEntry[]>(
        () => installableCatalog.filter((model) => !installedIds.has(model.id)),
        [installedIds]
    );

    return { installed, installedIds, installedEntries, availableEntries, loading, refresh };
}

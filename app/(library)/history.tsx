import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { useAppTranslation } from '@/i18n/hooks';
import { useThemeColors } from '@/theme/useThemeColors';
import { spacingTokens as s } from '@/styles/tokens/spacing';
import { listDocuments } from '@/data/repos/documents.repo';
import type { DocumentCardDto } from '@/data/codecs/documents.codec';

export default function HistoryScreen() {
    const { t } = useAppTranslation();
    const colors = useThemeColors();
    const router = useRouter();

    const [docs, setDocs] = useState<DocumentCardDto[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        listDocuments({ sort: 'updated_desc' })
            .then(setDocs)
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator color={colors.primary} />
            </View>
        );
    }

    if (!docs.length) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background }]}>
                <Text style={{ color: colors.mutedForeground }}>{t('library.empty_state')}</Text>
            </View>
        );
    }

    return (
        <FlatList
            style={{ backgroundColor: colors.background }}
            contentContainerStyle={styles.list}
            data={docs}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
                <Pressable
                    style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => router.push({ pathname: '/(reader)/[id]', params: { id: item.id } })}
                >
                    <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={2}>
                        {item.title}
                    </Text>
                    <Text style={[styles.cardMeta, { color: colors.mutedForeground }]}>
                        {item.language} · {item.updated_at.slice(0, 10)}
                    </Text>
                </Pressable>
            )}
        />
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    list: { padding: s[4], gap: s[3] },
    card: { padding: s[4], borderRadius: 10, borderWidth: 1, gap: s[1] },
    cardTitle: { fontSize: 15, fontWeight: '600' },
    cardMeta: { fontSize: 12 },
});

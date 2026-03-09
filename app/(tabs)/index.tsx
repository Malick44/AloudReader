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

export default function LibraryScreen() {
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
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                    {t('library.empty_state')}
                </Text>
                <Text style={[styles.emptyCta, { color: colors.mutedForeground }]}>
                    {t('library.empty_cta')}
                </Text>
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
                    onPress={() => router.push(`/(reader)/${item.id}`)}
                >
                    <Text style={[styles.docTitle, { color: colors.foreground }]} numberOfLines={2}>
                        {item.title}
                    </Text>
                    <Text style={[styles.docMeta, { color: colors.mutedForeground }]}>
                        {item.language}
                    </Text>
                </Pressable>
            )}
        />
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: s[3], padding: s[5] },
    list: { padding: s[4], gap: s[3] },
    emptyTitle: { fontSize: 16, fontWeight: '600' },
    emptyCta: { fontSize: 14, textAlign: 'center' },
    card: {
        padding: s[4],
        borderRadius: 10,
        borderWidth: 1,
        gap: s[1],
    },
    docTitle: { fontSize: 15, fontWeight: '600' },
    docMeta: { fontSize: 12 },
});

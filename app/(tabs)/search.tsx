import { useState } from 'react';
import { useRouter } from 'expo-router';
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { useAppTranslation } from '@/i18n/hooks';
import { useThemeColors } from '@/theme/useThemeColors';
import { spacingTokens as s } from '@/styles/tokens/spacing';
import { searchDocuments } from '@/data/repos/search.repo';
import type { SearchResultDto } from '@/data/codecs/search.codec';

export default function SearchScreen() {
    const { t } = useAppTranslation();
    const colors = useThemeColors();
    const router = useRouter();

    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResultDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    async function handleSearch(q: string) {
        if (!q.trim()) return;
        setLoading(true);
        setSearched(true);
        try {
            const data = await searchDocuments({ q: q.trim() });
            setResults(data);
        } catch {
            setResults([]);
        } finally {
            setLoading(false);
        }
    }

    return (
        <View style={[styles.root, { backgroundColor: colors.background }]}>
            <View style={styles.searchRow}>
                <TextInput
                    style={[
                        styles.input,
                        { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.surface },
                    ]}
                    value={query}
                    onChangeText={(v) => {
                        setQuery(v);
                        if (!v.trim()) { setResults([]); setSearched(false); }
                    }}
                    onSubmitEditing={() => handleSearch(query)}
                    placeholder={t('search.placeholder')}
                    placeholderTextColor={colors.mutedForeground}
                    returnKeyType="search"
                    autoCapitalize="none"
                    autoCorrect={false}
                />
            </View>

            {loading && (
                <ActivityIndicator color={colors.primary} style={{ marginTop: s[6] }} />
            )}

            {!loading && searched && !results.length && (
                <View style={styles.empty}>
                    <Text style={{ color: colors.mutedForeground }}>{t('search.empty_state')}</Text>
                </View>
            )}

            {!loading && (
                <FlatList
                    contentContainerStyle={styles.list}
                    data={results}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <Pressable
                            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
                            onPress={() => router.push(`/(reader)/${item.id}`)}
                        >
                            <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={2}>
                                {item.title}
                            </Text>
                            <Text style={[styles.cardMeta, { color: colors.mutedForeground }]}>
                                {item.language}
                            </Text>
                        </Pressable>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    searchRow: { padding: s[4] },
    input: {
        height: 44,
        borderWidth: 1,
        borderRadius: 22,
        paddingHorizontal: s[4],
        fontSize: 15,
    },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    list: { paddingHorizontal: s[4], gap: s[3] },
    card: {
        padding: s[4],
        borderRadius: 10,
        borderWidth: 1,
        gap: s[1],
    },
    cardTitle: { fontSize: 15, fontWeight: '600' },
    cardMeta: { fontSize: 12 },
});

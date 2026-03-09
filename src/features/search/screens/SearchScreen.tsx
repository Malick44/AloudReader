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

import { AppHeader } from '@/components/ui/AppHeader';
import { useAppTranslation } from '@/i18n/hooks';
import { useResponsiveLayout } from '@/shared/responsive/useResponsiveLayout';
import { ResponsiveContent } from '@/shared/ui/layout';
import { useThemeColors } from '@/theme/useThemeColors';
import { spacingTokens as s } from '@/styles/tokens/spacing';

import { useDocumentSearch } from '../hooks/useDocumentSearch';

export default function SearchScreen() {
    const { t } = useAppTranslation();
    const colors = useThemeColors();
    const router = useRouter();
    const { query, results, loading, searched, search, updateQuery } = useDocumentSearch();
    const { listColumns, screenPadding, contentMaxWidth } = useResponsiveLayout();

    return (
        <View style={[styles.root, { backgroundColor: colors.background }]}>
            <AppHeader title={t('navigation.tab_search')} />
            <ResponsiveContent style={styles.searchRow}>
                <TextInput
                    style={[
                        styles.input,
                        { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.surface },
                    ]}
                    value={query}
                    onChangeText={updateQuery}
                    onSubmitEditing={() => search(query)}
                    placeholder={t('search.placeholder')}
                    placeholderTextColor={colors.mutedForeground}
                    returnKeyType="search"
                    autoCapitalize="none"
                    autoCorrect={false}
                />
            </ResponsiveContent>

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
                    key={listColumns}
                    contentContainerStyle={[
                        styles.list,
                        {
                            paddingHorizontal: screenPadding,
                            paddingBottom: screenPadding,
                            maxWidth: contentMaxWidth,
                            width: '100%',
                            alignSelf: 'center',
                        },
                    ]}
                    columnWrapperStyle={listColumns > 1 ? styles.columnWrapper : undefined}
                    data={results}
                    keyExtractor={(item) => item.id}
                    numColumns={listColumns}
                    renderItem={({ item }) => (
                        <Pressable
                            style={[
                                styles.card,
                                listColumns > 1 && styles.gridCard,
                                { backgroundColor: colors.surface, borderColor: colors.border },
                            ]}
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
    columnWrapper: { gap: s[3] },
    card: {
        padding: s[4],
        borderRadius: 10,
        borderWidth: 1,
        gap: s[1],
        marginBottom: s[3],
    },
    gridCard: { flex: 1 },
    cardTitle: { fontSize: 15, fontWeight: '600' },
    cardMeta: { fontSize: 12 },
});

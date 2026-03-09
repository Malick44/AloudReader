import { useRouter } from 'expo-router';
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { useAppTranslation } from '@/i18n/hooks';
import { useResponsiveLayout } from '@/shared/responsive/useResponsiveLayout';
import { useThemeColors } from '@/theme/useThemeColors';
import { spacingTokens as s } from '@/styles/tokens/spacing';

import { useLibraryDocuments } from '../hooks/useLibraryDocuments';

export default function LibraryScreen() {
    const { t } = useAppTranslation();
    const colors = useThemeColors();
    const router = useRouter();
    const { documents, loading, refreshing, refresh } = useLibraryDocuments();
    const { listColumns, screenPadding, contentMaxWidth } = useResponsiveLayout();

    return (
        <View style={[styles.root, { backgroundColor: colors.background }]}>
            <AppHeader title={t('navigation.tab_library')} />

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator color={colors.primary} />
                </View>
            ) : !documents.length ? (
                <FlatList
                    data={[]}
                    renderItem={null}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={refresh}
                            tintColor={colors.primary}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                                {t('library.empty_state')}
                            </Text>
                            <Text style={[styles.emptyCta, { color: colors.mutedForeground }]}>
                                {t('library.empty_cta')}
                            </Text>
                        </View>
                    }
                />
            ) : (
                <FlatList
                    key={listColumns}
                    contentContainerStyle={[
                        styles.list,
                        {
                            padding: screenPadding,
                            maxWidth: contentMaxWidth,
                            width: '100%',
                            alignSelf: 'center',
                        },
                    ]}
                    columnWrapperStyle={listColumns > 1 ? styles.columnWrapper : undefined}
                    data={documents}
                    keyExtractor={(item) => item.id}
                    numColumns={listColumns}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={refresh}
                            tintColor={colors.primary}
                        />
                    }
                    renderItem={({ item }) => (
                        <Pressable
                            style={[
                                styles.card,
                                listColumns > 1 && styles.gridCard,
                                { backgroundColor: colors.surface, borderColor: colors.border },
                            ]}
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
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: s[3], padding: s[5] },
    list: { padding: s[4], gap: s[3] },
    columnWrapper: { gap: s[3] },
    emptyTitle: { fontSize: 16, fontWeight: '600' },
    emptyCta: { fontSize: 14, textAlign: 'center' },
    card: {
        padding: s[4],
        borderRadius: 10,
        borderWidth: 1,
        gap: s[1],
        marginBottom: s[3],
    },
    gridCard: { flex: 1 },
    docTitle: { fontSize: 15, fontWeight: '600' },
    docMeta: { fontSize: 12 },
});

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
import { ArrowLeft } from 'lucide-react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { useAppTranslation } from '@/i18n/hooks';
import { useResponsiveLayout } from '@/shared/responsive/useResponsiveLayout';
import { useThemeColors } from '@/theme/useThemeColors';
import { spacingTokens as s } from '@/styles/tokens/spacing';

import { useLibraryDocuments } from '../hooks/useLibraryDocuments';

export default function HistoryScreen() {
    const { t } = useAppTranslation();
    const colors = useThemeColors();
    const router = useRouter();
    const { documents, loading, refreshing, refresh } = useLibraryDocuments();
    const { listColumns, screenPadding, contentMaxWidth } = useResponsiveLayout();

    return (
        <View style={[styles.screen, { backgroundColor: colors.background }]}>
            <AppHeader
                title={t('library.history_title')}
                leftActions={[{
                    node: <ArrowLeft size={22} color={colors.foreground} />,
                    onPress: router.back,
                    accessibilityLabel: 'Back',
                }]}
            />
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator color={colors.primary} />
                </View>
            ) : !documents.length ? (
                <View style={styles.center}>
                    <Text style={{ color: colors.mutedForeground }}>{t('library.empty_state')}</Text>
                </View>
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
                            onPress={() => router.push({ pathname: '/(reader)/[id]', params: { id: item.id } })}
                        >
                            <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={2}>
                                {item.title}
                            </Text>
                            <Text style={[styles.cardMeta, { color: colors.mutedForeground }]}>
                                {`${item.language} · ${item.updated_at.slice(0, 10)}`}
                            </Text>
                        </Pressable>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    list: { padding: s[4], gap: s[3] },
    columnWrapper: { gap: s[3] },
    card: { padding: s[4], borderRadius: 10, borderWidth: 1, gap: s[1], marginBottom: s[3] },
    gridCard: { flex: 1 },
    cardTitle: { fontSize: 15, fontWeight: '600' },
    cardMeta: { fontSize: 12 },
});

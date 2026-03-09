import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { Button } from '@/components/ui/Button';
import { useAppTranslation } from '@/i18n/hooks';
import { useThemeColors } from '@/theme/useThemeColors';
import { spacingTokens as s } from '@/styles/tokens/spacing';

import { useDocumentDetail } from '../hooks/useDocumentDetail';
import { deleteLibraryDocument } from '../services/library-service';

export default function DocumentDetailScreen() {
    const { t } = useAppTranslation();
    const colors = useThemeColors();
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { document, loading } = useDocumentDetail(id);

    function handleDelete() {
        Alert.alert(t('library.delete_confirm'), undefined, [
            { text: t('common.cancel'), style: 'cancel' },
            {
                text: t('library.delete_button'),
                style: 'destructive',
                onPress: async () => {
                    if (id) {
                        try {
                            await deleteLibraryDocument(id);
                        } catch {
                            // Already removed from local cache; ignore remote error.
                        }
                    }
                    router.back();
                },
            },
        ]);
    }

    return (
        <View style={[styles.screen, { backgroundColor: colors.background }]}>
            <AppHeader
                title={document?.title ?? t('library.title')}
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
            ) : !document ? (
                <View style={styles.center}>
                    <Text style={{ color: colors.mutedForeground }}>{t('errors.unknown_error')}</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.container}>
                    <Text style={[styles.title, { color: colors.foreground }]}>{document.title}</Text>
                    <Text style={[styles.meta, { color: colors.mutedForeground }]}>
                        {`${document.source_type} · ${document.language}`}
                    </Text>

                    <View style={styles.preview}>
                        <Text style={[styles.previewText, { color: colors.foreground }]} numberOfLines={10}>
                            {document.body}
                        </Text>
                    </View>

                    <Button
                        label={t('library.start_listening')}
                        onPress={() => router.push({ pathname: '/(reader)/[id]', params: { id: document.id } })}
                    />
                    <Button label={t('library.delete_button')} variant="destructive" onPress={handleDelete} />
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    container: { padding: s[5], gap: s[4] },
    title: { fontSize: 20, fontWeight: '700', lineHeight: 28 },
    meta: { fontSize: 13 },
    preview: { gap: s[2] },
    previewText: { fontSize: 14, lineHeight: 22 },
});

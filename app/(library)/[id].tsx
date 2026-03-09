import { useEffect, useState } from 'react';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { Button } from '@/components/ui/Button';
import { useAppTranslation } from '@/i18n/hooks';
import { useThemeColors } from '@/theme/useThemeColors';
import { spacingTokens as s } from '@/styles/tokens/spacing';
import { getDocumentDetail } from '@/data/repos/documents.repo';
import type { DocumentDetailDto } from '@/data/codecs/documents.codec';

export default function DocumentDetailScreen() {
    const { t } = useAppTranslation();
    const colors = useThemeColors();
    const router = useRouter();
    const navigation = useNavigation();
    const { id } = useLocalSearchParams<{ id: string }>();

    const [doc, setDoc] = useState<DocumentDetailDto | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getDocumentDetail(id)
            .then((d) => {
                setDoc(d);
                navigation.setOptions({ title: d.title });
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator color={colors.primary} />
            </View>
        );
    }

    if (!doc) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background }]}>
                <Text style={{ color: colors.mutedForeground }}>{t('errors.unknown_error')}</Text>
            </View>
        );
    }

    function handleDelete() {
        Alert.alert(t('library.delete_confirm'), undefined, [
            { text: t('common.cancel'), style: 'cancel' },
            {
                text: t('library.delete_button'),
                style: 'destructive',
                onPress: () => {
                    // TODO: call deleteDocument(id) then navigate back
                    router.back();
                },
            },
        ]);
    }

    return (
        <ScrollView
            style={{ backgroundColor: colors.background }}
            contentContainerStyle={styles.container}
        >
            <Text style={[styles.title, { color: colors.foreground }]}>{doc.title}</Text>
            <Text style={[styles.meta, { color: colors.mutedForeground }]}>
                {doc.source_type} · {doc.language}
            </Text>

            <View style={styles.preview}>
                <Text style={[styles.previewText, { color: colors.foreground }]} numberOfLines={10}>
                    {doc.body}
                </Text>
            </View>

            <Button
                label={t('library.start_listening')}
                onPress={() => router.push({ pathname: '/(reader)/[id]', params: { id: doc.id } })}
            />
            <Button label={t('library.delete_button')} variant="destructive" onPress={handleDelete} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    container: { padding: s[5], gap: s[4] },
    title: { fontSize: 20, fontWeight: '700', lineHeight: 28 },
    meta: { fontSize: 13 },
    preview: { gap: s[2] },
    previewText: { fontSize: 14, lineHeight: 22 },
});

import { useState } from 'react';
import { useRouter } from 'expo-router';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { Button } from '@/components/ui/Button';
import { useAppTranslation } from '@/i18n/hooks';
import { ResponsiveScrollView, ResponsiveTwoPane } from '@/shared/ui/layout';
import { useThemeColors } from '@/theme/useThemeColors';
import { spacingTokens as s } from '@/styles/tokens/spacing';
import {
    extractTextFromFile,
    extractTextFromUrl,
    normalizePastedText,
    TextExtractionError,
} from '@/lib/text';
import { saveDocumentToLibrary } from '@/features/library/services/library-service';

type Tab = 'paste' | 'url' | 'file';

export default function ListenScreen() {
    const { t } = useAppTranslation();
    const colors = useThemeColors();
    const router = useRouter();

    const [tab, setTab] = useState<Tab>('paste');
    const [pasteText, setPasteText] = useState('');
    const [urlText, setUrlText] = useState('');
    const [extractedText, setExtractedText] = useState('');
    const [extractedTitle, setExtractedTitle] = useState('');
    const [filename, setFilename] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [savedId, setSavedId] = useState<string | null>(null);

    const tabLabels: { key: Tab; label: string }[] = [
        { key: 'paste', label: t('listen.tab_paste') },
        { key: 'url', label: t('listen.tab_url') },
        { key: 'file', label: t('listen.tab_file') },
    ];

    async function handleLoadUrl() {
        if (!urlText.trim()) return;
        setLoading(true);
        setExtractedText('');
        try {
            const result = await extractTextFromUrl(urlText.trim());
            setExtractedText(result.text);
            setExtractedTitle(result.title ?? '');
        } catch (err) {
            const detail = err instanceof Error ? err.message : String(err);
            console.warn('[listen] URL extraction failed:', detail);
            const headline =
                err instanceof TextExtractionError
                    ? t('listen.url_load_error')
                    : t('errors.unknown_error');
            Alert.alert(headline, detail);
        } finally {
            setLoading(false);
        }
    }

    async function handlePickFile() {
        setLoading(true);
        setFilename(null);
        setExtractedText('');
        try {
            const result = await extractTextFromFile();
            setFilename(result.filename);
            setExtractedText(result.text);
            setExtractedTitle(result.filename);
        } catch (err) {
            if (err instanceof TextExtractionError && err.code === 'FILE_PICK_CANCELLED') {
                return;
            }
            const msg =
                err instanceof TextExtractionError && err.code === 'PDF_NOT_SUPPORTED'
                    ? t('listen.pdf_not_supported')
                    : t('listen.file_load_error');
            Alert.alert(msg);
        } finally {
            setLoading(false);
        }
    }

    async function handleListen() {
        let text = '';
        let title = extractedTitle || t('miniplayer.default_title');
        const sourceType = tab === 'url' ? 'article' : 'note';

        if (tab === 'paste') {
            try {
                const result = normalizePastedText(pasteText);
                text = result.text;
                title = text.slice(0, 60);
            } catch {
                Alert.alert(t('listen.empty_text_error'));
                return;
            }
        } else {
            text = extractedText;
        }

        if (!text.trim()) {
            Alert.alert(t('listen.empty_text_error'));
            return;
        }

        // Save to library first so the document appears in the library and
        // the reader can load it from the local cache by real ID.
        setSaving(true);
        let docId = '__new__';
        try {
            const saved = await saveDocumentToLibrary({ title, body: text, sourceType });
            docId = saved.id;
            setSavedId(saved.id);
        } catch {
            // Fall back to ad-hoc playback if save fails (e.g. network error).
        } finally {
            setSaving(false);
        }

        router.push({
            pathname: '/(reader)/[id]',
            params: docId !== '__new__'
                ? { id: docId }
                : { id: '__new__', text, title },
        });
    }

    const activeText = tab === 'paste' ? pasteText : extractedText;

    return (
        <View style={[styles.root, { backgroundColor: colors.background }]}>
            <AppHeader title={t('navigation.tab_listen')} />
            <ResponsiveScrollView
                style={styles.scrollFlex}
                innerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
                widthVariant="content"
            >
                <ResponsiveTwoPane
                    primary={(
                        <View style={styles.primaryPane}>
                            <View style={[styles.segmentRow, { backgroundColor: colors.muted, borderRadius: 8 }]}>
                                {tabLabels.map(({ key, label }) => (
                                    <View
                                        key={key}
                                        style={[
                                            styles.segmentItem,
                                            tab === key && { backgroundColor: colors.surface, borderRadius: 6 },
                                        ]}
                                    >
                                        <Button
                                            label={label}
                                            variant={tab === key ? 'secondary' : 'ghost'}
                                            onPress={() => {
                                                setTab(key);
                                                setExtractedText('');
                                                setFilename(null);
                                                setSavedId(null);
                                            }}
                                        />
                                    </View>
                                ))}
                            </View>

                            {tab === 'paste' && (
                                <TextInput
                                    style={[
                                        styles.textArea,
                                        { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.surface },
                                    ]}
                                    multiline
                                    numberOfLines={10}
                                    textAlignVertical="top"
                                    value={pasteText}
                                    onChangeText={(v) => { setPasteText(v); setSavedId(null); }}
                                    placeholder={t('listen.paste_placeholder')}
                                    placeholderTextColor={colors.mutedForeground}
                                />
                            )}

                            {tab === 'url' && (
                                <View style={styles.urlRow}>
                                    <TextInput
                                        style={[
                                            styles.urlInput,
                                            { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.surface },
                                        ]}
                                        value={urlText}
                                        onChangeText={setUrlText}
                                        placeholder={t('listen.url_placeholder')}
                                        placeholderTextColor={colors.mutedForeground}
                                        keyboardType="url"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                    <Button label={t('listen.load_url_button')} onPress={handleLoadUrl} />
                                </View>
                            )}

                            {tab === 'file' && (
                                <View style={styles.fileArea}>
                                    <Button label={t('listen.pick_file_button')} onPress={handlePickFile} />
                                    {filename && (
                                        <Text style={[styles.fileLabel, { color: colors.mutedForeground }]}>
                                            {t('listen.file_picked_label', { filename })}
                                        </Text>
                                    )}
                                </View>
                            )}

                            {loading && <ActivityIndicator color={colors.primary} style={styles.spinner} />}

                            <Button
                                label={saving ? t('listen.save_saving') : t('listen.listen_button')}
                                onPress={handleListen}
                                disabled={loading || saving || (tab !== 'paste' && !extractedText)}
                            />
                        </View>
                    )}
                    secondary={(
                        <View style={[styles.previewPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Text style={[styles.previewLabel, { color: colors.mutedForeground }]}>
                                {t('listen.text_preview_label')}
                            </Text>
                            <Text style={[styles.preview, { color: colors.foreground, borderColor: colors.border }]}>
                                {activeText || t('listen.empty_text_error')}
                            </Text>
                        </View>
                    )}
                />
            </ResponsiveScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    scrollFlex: { flex: 1 },
    container: {
        gap: s[4],
    },
    primaryPane: { gap: s[4] },
    segmentRow: {
        flexDirection: 'row',
        padding: 2,
    },
    segmentItem: {
        flex: 1,
    },
    textArea: {
        minHeight: 160,
        borderWidth: 1,
        borderRadius: 8,
        padding: s[3],
        fontSize: 15,
    },
    urlRow: { gap: s[2] },
    urlInput: {
        height: 44,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: s[3],
        fontSize: 15,
    },
    fileArea: { gap: s[3] },
    fileLabel: { fontSize: 13 },
    spinner: { marginVertical: s[4] },
    previewLabel: { fontSize: 12, marginBottom: s[1] },
    previewPanel: {
        borderWidth: 1,
        borderRadius: 16,
        padding: s[4],
        minHeight: 220,
    },
    preview: {
        fontSize: 14,
        lineHeight: 20,
        borderWidth: 1,
        borderRadius: 8,
        padding: s[3],
        minHeight: 160,
    },
});

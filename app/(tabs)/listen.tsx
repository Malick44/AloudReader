import { useState } from 'react';
import { useRouter } from 'expo-router';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { Button } from '@/components/ui/Button';
import { useAppTranslation } from '@/i18n/hooks';
import { useThemeColors } from '@/theme/useThemeColors';
import { spacingTokens as s } from '@/styles/tokens/spacing';
import {
    extractTextFromFile,
    extractTextFromUrl,
    normalizePastedText,
    TextExtractionError,
} from '@/lib/text';

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

    function handleListen() {
        let text = '';
        let title = extractedTitle || t('miniplayer.default_title');

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

        // Navigate to ad-hoc reader with text embedded in params
        router.push({
            pathname: '/(reader)/[id]',
            params: { id: '__new__', text, title },
        });
    }

    const activeText = tab === 'paste' ? pasteText : extractedText;

    return (
        <ScrollView
            style={{ backgroundColor: colors.background }}
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
        >
            {/* Segmented tabs */}
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
                            }}
                        />
                    </View>
                ))}
            </View>

            {/* Paste tab */}
            {tab === 'paste' && (
                <TextInput
                    style={[
                        styles.textArea,
                        { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.surface },
                    ]}
                    multiline
                    numberOfLines={8}
                    textAlignVertical="top"
                    value={pasteText}
                    onChangeText={setPasteText}
                    placeholder={t('listen.paste_placeholder')}
                    placeholderTextColor={colors.mutedForeground}
                />
            )}

            {/* URL tab */}
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

            {/* File tab */}
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

            {/* Loading indicator */}
            {loading && <ActivityIndicator color={colors.primary} style={styles.spinner} />}

            {/* Text preview */}
            {!loading && activeText.length > 0 && (
                <View>
                    <Text style={[styles.previewLabel, { color: colors.mutedForeground }]}>
                        {t('listen.text_preview_label')}
                    </Text>
                    <Text style={[styles.preview, { color: colors.foreground, borderColor: colors.border }]} numberOfLines={6}>
                        {activeText}
                    </Text>
                </View>
            )}

            {/* Listen CTA */}
            <Button
                label={t('listen.listen_button')}
                onPress={handleListen}
                disabled={loading || (tab !== 'paste' && !extractedText)}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: s[4],
        gap: s[4],
        flexGrow: 1,
    },
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
    preview: {
        fontSize: 14,
        lineHeight: 20,
        borderWidth: 1,
        borderRadius: 8,
        padding: s[3],
    },
});

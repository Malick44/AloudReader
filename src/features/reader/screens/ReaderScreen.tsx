import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { ArrowLeft, MoreVertical } from 'lucide-react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { useAppTranslation } from '@/i18n/hooks';
import { ResponsiveContent } from '@/shared/ui/layout';
import { useThemeColors } from '@/theme/useThemeColors';
import { spacingTokens as s } from '@/styles/tokens/spacing';
import { useLocalTtsReader } from '@/features/tts/useLocalTtsReader';
import { useReaderSessionStore } from '@/features/tts/reader-session-store';
import { useTtsUiStore } from '@/features/tts/tts-store';
import { toPipelineDefaults } from '@/lib/tts';

import { ReaderPlayer } from '../components/ReaderPlayer';
import { resolveReaderContent, type ReaderRouteParams } from '../services/reader-content-service';
import { useReadingProgressStore } from '../store/reading-progress-store';

export default function ReaderScreen() {
    const { t } = useAppTranslation();
    const colors = useThemeColors();
    const params = useLocalSearchParams<ReaderRouteParams>();
    const { id, text, title } = params;

    const { selectedModelId, playbackRate, setPlaybackRate } = useTtsUiStore();
    const setSession = useReaderSessionStore((state) => state.setSession);
    const { currentChunkIndex, pipeline } = useReaderSessionStore();

    const reader = useLocalTtsReader(playbackRate);

    const { getPosition, savePosition } = useReadingProgressStore();

    const [docTitle, setDocTitle] = useState('');

    /**
     * `resolvedTextRef` holds the *full* document body.
     * `resumeOffsetRef` holds the char offset into that full body where
     * playback will resume from (derived from saved progress on first open).
     */
    const resolvedTextRef = useRef('');
    const resumeOffsetRef = useRef(0);

    // ── Load content on mount (no auto-play) ─────────────────────────────────
    useEffect(() => {
        async function load() {
            const resolved = await resolveReaderContent({ id, text, title }, t('miniplayer.default_title'));
            if (!resolved) return;

            resolvedTextRef.current = resolved.text;
            // Restore saved position (0 = beginning for new documents).
            resumeOffsetRef.current = getPosition(id);

            setDocTitle(resolved.title);
            setSession(id, resolved.title);
        }

        void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // ── Save progress whenever the active chunk advances ─────────────────────
    useEffect(() => {
        if (!pipeline || currentChunkIndex < 0) return;

        // Sum up the chars in all completed chunks to get the absolute offset.
        const charsCompleted = pipeline.chunks
            .slice(0, currentChunkIndex)
            .reduce((sum, c) => sum + c.chunk.text.length, 0);

        const absoluteOffset = resumeOffsetRef.current + charsCompleted;
        savePosition(id, absoluteOffset);
    }, [currentChunkIndex, id, pipeline, savePosition]);

    // ── Playback controls ─────────────────────────────────────────────────────
    const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
    function handleCycleSpeed() {
        const idx = SPEED_OPTIONS.indexOf(playbackRate);
        const next = SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length] ?? 1.0;
        setPlaybackRate(next);
    }

    function handlePlayPause() {
        const options = { ...toPipelineDefaults(selectedModelId), rate: playbackRate };

        if (reader.isPaused) {
            reader.resume();
        } else if (reader.isPlaying) {
            reader.pause();
        } else if (reader.pipeline) {
            // Pipeline already prepared (e.g. user paused then pressed play again).
            void reader.play(options);
        } else {
            // First play — stream from the saved position.
            const fullText = resolvedTextRef.current;
            const offset = resumeOffsetRef.current;
            const textToPlay = offset > 0 && offset < fullText.length
                ? fullText.slice(offset)
                : fullText;
            void reader.stream(textToPlay, options);
        }
    }

    const titleText = docTitle || title || t('miniplayer.default_title');
    const subtitleText = `${selectedModelId} · ${t('reader.speed_label', { speed: playbackRate })}`;

    // Show an idle prompt when content is loaded but not yet playing.
    const isIdle = Boolean(docTitle) && !reader.isPreparing && !reader.isPlaying && !reader.isPaused && !reader.activeChunk;
    const resumePct = resolvedTextRef.current.length > 0 && resumeOffsetRef.current > 0
        ? Math.round((resumeOffsetRef.current / resolvedTextRef.current.length) * 100)
        : 0;
    return (
        <View style={[styles.wrapper, { backgroundColor: colors.background }]}>
            <AppHeader
                title="Now Reading"
                backgroundColor={colors.background}
                leftActions={[{
                    node: <ArrowLeft size={22} color={colors.foreground} />,
                    onPress: router.back,
                    accessibilityLabel: 'Back',
                }]}
                rightActions={[{
                    node: <MoreVertical size={22} color={colors.foreground} />,
                    accessibilityLabel: 'More options',
                }]}
            />
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.container}
            >
                <ResponsiveContent widthVariant="reading">
                    <View style={styles.headerArea}>
                        <Text style={[styles.articleTitle, { color: colors.foreground }]}>
                            {titleText}
                        </Text>
                        <Text style={[styles.articleSubtitle, { color: colors.primary }]}>
                            {subtitleText}
                        </Text>
                    </View>

                    {reader.isPreparing && (
                        <View style={styles.center}>
                            <ActivityIndicator color={colors.primary} />
                            <Text style={[styles.statusText, { color: colors.mutedForeground }]}>
                                {t('reader.preparing_button')}
                            </Text>
                        </View>
                    )}

                    {isIdle && (
                        <View style={styles.center}>
                            <Text style={[styles.idleHint, { color: colors.mutedForeground }]}>
                                {resumePct > 0
                                    ? `${t('reader.resume_hint')} ${resumePct}%`
                                    : t('reader.start_hint')}
                            </Text>
                        </View>
                    )}

                    {reader.activeChunk && (
                        <View style={[
                            styles.activeHighlight,
                            {
                                backgroundColor: colors.primary + '15',
                                borderLeftColor: colors.primary,
                            },
                        ]}>
                            <Text style={[styles.chunkText, { color: colors.foreground }]}>
                                {reader.activeChunk.text}
                            </Text>
                        </View>
                    )}

                    {reader.errorMessage && (
                        <Text style={[styles.errorText, { color: colors.destructive }]}>
                            {reader.errorMessage}
                        </Text>
                    )}

                    <View style={{ height: 160 }} />
                </ResponsiveContent>
            </ScrollView>

            <ReaderPlayer
                colors={colors}
                progressPct={reader.progressPct}
                playbackRate={playbackRate}
                elapsedSeconds={reader.elapsedSeconds}
                remainingSeconds={reader.remainingSeconds}
                isPlaying={reader.isPlaying}
                onPlayPause={handlePlayPause}
                onOpenVoices={() => router.push('/(settings)/voices')}
                onRewind={reader.rewindChunk}
                onSkip={reader.skipChunk}
                onCycleSpeed={handleCycleSpeed}
                onOpenHistory={() => router.push('/(library)/history')}
                onOpenSettings={() => router.push('/(tabs)/settings')}
                labels={{
                    completeSuffix: '%',
                    voice: t('settings.voice_label'),
                    back: 'Back',
                    next: 'Next',
                    speed: t('settings.playback_title'),
                    bookmarks: t('library.history_title'),
                    settings: t('settings.title'),
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: { flex: 1 },
    container: {
        padding: s[5],
        gap: s[4],
        flexGrow: 1,
    },
    headerArea: {
        marginBottom: s[4],
        gap: s[2],
    },
    articleTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        lineHeight: 34,
    },
    articleSubtitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    center: {
        gap: s[3],
        alignItems: 'center',
        paddingVertical: s[8],
    },
    statusText: { fontSize: 14 },
    idleHint: { fontSize: 15, textAlign: 'center', paddingHorizontal: s[4] },
    activeHighlight: {
        padding: s[4],
        borderLeftWidth: 4,
        borderTopRightRadius: 8,
        borderBottomRightRadius: 8,
    },
    chunkText: {
        fontSize: 18,
        lineHeight: 28,
        fontWeight: '500',
    },
    errorText: { fontSize: 14 },
});

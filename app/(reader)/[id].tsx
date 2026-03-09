import { useEffect, useState } from 'react';
import { useLocalSearchParams, useNavigation, router } from 'expo-router';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    View,
    Pressable,
} from 'react-native';
import { ArrowLeft, MoreVertical, List, Bookmark, Settings, Play, Pause, RotateCcw, RotateCw, User } from 'lucide-react-native';

import { useAppTranslation } from '@/i18n/hooks';
import { useThemeColors } from '@/theme/useThemeColors';
import { spacingTokens as s } from '@/styles/tokens/spacing';
import { useLocalTtsReader } from '@/features/tts/useLocalTtsReader';
import { useReaderSessionStore } from '@/features/tts/reader-session-store';
import { useTtsUiStore } from '@/features/tts/tts-store';
import { toPipelineDefaults } from '@/lib/tts';
import { getDocumentDetail } from '@/data/repos/documents.repo';

export default function ReaderScreen() {
    const { t } = useAppTranslation();
    const colors = useThemeColors();
    const params = useLocalSearchParams<{ id: string; text?: string; title?: string }>();
    const navigation = useNavigation();

    const { selectedModelId, playbackRate } = useTtsUiStore();
    const sessionStore = useReaderSessionStore();

    const reader = useLocalTtsReader();

    const [docTitle, setDocTitle] = useState('');

    // Start reading when screen mounts
    useEffect(() => {
        async function start() {
            let text = '';
            let title = params.title ?? t('miniplayer.default_title');

            if (params.id === '__new__' && params.text) {
                text = params.text;
            } else {
                try {
                    const doc = await getDocumentDetail(params.id);
                    text = doc.body;
                    title = doc.title;
                } catch {
                    return;
                }
            }

            setDocTitle(title);
            
            navigation.setOptions({
                title: 'Now Reading',
                headerTitleAlign: 'center',
                headerTitleStyle: { fontWeight: '600', color: colors.foreground },
                headerLeft: () => (
                    <Pressable onPress={() => router.back()} style={{ paddingHorizontal: s[3] }}>
                        <ArrowLeft size={24} color={colors.foreground} />
                    </Pressable>
                ),
                headerRight: () => (
                    <Pressable style={{ paddingHorizontal: s[3] }}>
                        <MoreVertical size={24} color={colors.foreground} />
                    </Pressable>
                ),
                headerStyle: { backgroundColor: colors.background },
                headerShadowVisible: false,
            });

            const modelId = selectedModelId;
            const options = { ...toPipelineDefaults(modelId), rate: playbackRate };

            sessionStore.setSession(params.id, title);
            sessionStore.setPlaying(true);

            await reader.stream(text, options);
        }

        start();

        return () => {
            reader.stop();
        };
    }, [params.id]);

    // Keep session store in sync
    useEffect(() => {
        sessionStore.setPlaying(reader.isPlaying);
    }, [reader.isPlaying]);

    useEffect(() => {
        sessionStore.setProgress(reader.progressPct);
    }, [reader.progressPct]);

    function handlePlayPause() {
        if (reader.isPaused) {
            reader.resume();
        } else if (reader.isPlaying) {
            reader.pause();
        }
    }

    const DEFAULT_TITLE = 'The Evolution of Generative AI';
    const SUBTITLE = 'Chapter 4: Neural Architectures';
    const TIME_PASSED = '12:45';
    const TIME_LEFT = '-24:10';
    const COMPLETE_TXT = '% complete';
    const VOICE_TXT = 'VOICE';
    const SKIP_TXT = '5';
    const SPEED_VAL = `${playbackRate}x`;
    const SPEED_TXT = 'SPEED';
    const CONTENTS_TXT = 'Contents';
    const BOOKMARKS_TXT = 'Bookmarks';
    const SETTINGS_TXT = 'Settings';

    return (
        <View style={[styles.wrapper, { backgroundColor: colors.background }]}>
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.container}
            >
                {/* Title and Subtitle */}
                <View style={styles.headerArea}>
                    <Text style={[styles.articleTitle, { color: colors.foreground }]}>
                        {docTitle || DEFAULT_TITLE}
                    </Text>
                    <Text style={[styles.articleSubtitle, { color: colors.primary }]}>
                        {SUBTITLE}
                    </Text>
                </View>

                {/* Preparing state */}
                {reader.isPreparing && (
                    <View style={styles.center}>
                        <ActivityIndicator color={colors.primary} />
                        <Text style={[styles.statusText, { color: colors.mutedForeground }]}>
                            {t('reader.preparing_button')}
                        </Text>
                    </View>
                )}

                {/* Current chunk highlight */}
                {reader.activeChunk && (
                    <View style={[
                        styles.activeHighlight, 
                        { 
                            backgroundColor: colors.primary + '15', // light blue background
                            borderLeftColor: colors.primary,
                        }
                    ]}>
                        <Text style={[styles.chunkText, { color: colors.foreground }]}>
                            {reader.activeChunk.text}
                        </Text>
                    </View>
                )}

                {/* Error */}
                {reader.errorMessage && (
                    <Text style={[styles.errorText, { color: colors.destructive }]}>
                        {reader.errorMessage}
                    </Text>
                )}
                
                <View style={{ height: 160 }} />
            </ScrollView>

            {/* Persistent Bottom Player Bar */}
            <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border, shadowColor: colors.foreground }]}>
                {/* Progress Section */}
                <View style={styles.progressSection}>
                    <View style={styles.progressRow}>
                        <Text style={[styles.progressTime, { color: colors.foreground }]}>{TIME_PASSED}</Text>
                        <Text style={[styles.progressPercent, { color: colors.mutedForeground }]}>
                            {reader.progressPct ? Math.round(reader.progressPct) : 0}{COMPLETE_TXT}
                        </Text>
                        <Text style={[styles.progressTime, { color: colors.foreground }]}>{TIME_LEFT}</Text>
                    </View>
                    <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
                        <View style={[styles.progressFill, { width: `${reader.progressPct || 0}%`, backgroundColor: colors.primary }]} />
                        <View style={[styles.progressKnob, { backgroundColor: colors.primary, left: `${reader.progressPct || 0}%` }]} />
                    </View>
                </View>

                {/* Playback Controls */}
                <View style={styles.controlRow}>
                    <Pressable style={styles.controlAction} onPress={() => router.push('/(settings)/voices')}>
                        <User size={24} color={colors.mutedForeground} />
                        <Text style={[styles.controlLabel, { color: colors.mutedForeground }]}>{VOICE_TXT}</Text>
                    </Pressable>

                    <Pressable style={styles.skipBtn} onPress={reader.rewindChunk}>
                        <RotateCcw size={28} color={colors.foreground} />
                        <Text style={[styles.skipText, { color: colors.foreground }]}>{SKIP_TXT}</Text>
                    </Pressable>

                    <Pressable 
                        style={[styles.playPauseBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
                        onPress={handlePlayPause}
                    >
                        {reader.isPlaying ? (
                            <Pause size={32} color={colors.background} fill={colors.background} />
                        ) : (
                            <Play size={32} color={colors.background} fill={colors.background} style={{ marginLeft: 4 }} />
                        )}
                    </Pressable>

                    <Pressable style={styles.skipBtn} onPress={reader.skipChunk}>
                        <RotateCw size={28} color={colors.foreground} />
                        <Text style={[styles.skipText, { color: colors.foreground }]}>{SKIP_TXT}</Text>
                    </Pressable>

                    <Pressable style={styles.controlAction} onPress={() => router.push('/(settings)/playback')}>
                        <Text style={[styles.speedText, { color: colors.foreground }]}>{SPEED_VAL}</Text>
                        <Text style={[styles.controlLabel, { color: colors.mutedForeground }]}>{SPEED_TXT}</Text>
                    </Pressable>
                </View>

                {/* Bottom Utility Navigation */}
                <View style={styles.utilityRow}>
                    <Pressable style={styles.utilityAction}>
                        <List size={20} color={colors.mutedForeground} />
                        <Text style={[styles.utilityLabel, { color: colors.mutedForeground }]}>{CONTENTS_TXT}</Text>
                    </Pressable>
                    <Pressable style={styles.utilityAction} onPress={() => router.push('/(library)/history')}>
                        <Bookmark size={20} color={colors.mutedForeground} />
                        <Text style={[styles.utilityLabel, { color: colors.mutedForeground }]}>{BOOKMARKS_TXT}</Text>
                    </Pressable>
                    <Pressable style={styles.utilityAction} onPress={() => router.push('/(tabs)/settings')}>
                        <Settings size={20} color={colors.mutedForeground} />
                        <Text style={[styles.utilityLabel, { color: colors.mutedForeground }]}>{SETTINGS_TXT}</Text>
                    </Pressable>
                </View>
            </View>
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
    
    // Bottom Bar Styles
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingTop: s[4],
        paddingBottom: s[8],
        paddingHorizontal: s[5],
        borderTopWidth: 1,
        elevation: 10,
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    progressSection: {
        gap: s[2],
        marginBottom: s[6],
    },
    progressRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    progressTime: {
        fontSize: 12,
        fontWeight: '500',
    },
    progressPercent: {
        fontSize: 12,
    },
    progressTrack: {
        height: 4,
        borderRadius: 2,
        width: '100%',
        position: 'relative',
    },
    progressFill: {
        height: 4,
        borderRadius: 2,
    },
    progressKnob: {
        position: 'absolute',
        top: -4,
        width: 12,
        height: 12,
        borderRadius: 6,
        transform: [{ translateX: -6 }],
    },
    controlRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: s[6],
    },
    controlAction: {
        alignItems: 'center',
        gap: s[1],
        width: 60,
    },
    controlLabel: {
        fontSize: 10,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    speedText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    skipBtn: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    skipText: {
        position: 'absolute',
        fontSize: 10,
        fontWeight: 'bold',
    },
    playPauseBtn: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 8,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    utilityRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    utilityAction: {
        alignItems: 'center',
        gap: s[1],
    },
    utilityLabel: {
        fontSize: 12,
        fontWeight: '500',
    },
});

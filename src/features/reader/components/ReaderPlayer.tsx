import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BookmarkCheck, Bot, LayoutList, Pause, Play, SkipBack, SkipForward, SlidersHorizontal } from 'lucide-react-native';

import { spacingTokens as s } from '@/styles/tokens/spacing';
import type { ThemeColors } from '@/theme/useThemeColors';
import { ResponsiveContent } from '@/shared/ui/layout';

type ReaderPlayerLabels = {
    completeSuffix?: string;
    voice?: string;
    back?: string;
    next?: string;
    speed?: string;
    contents?: string;
    bookmarks?: string;
    settings?: string;
};

type ReaderPlayerProps = {
    colors: ThemeColors;
    progressPct: number;
    playbackRate: number;
    elapsedSeconds: number;
    remainingSeconds: number | null;
    isPlaying: boolean;
    onPlayPause: () => void;
    onOpenVoices: () => void;
    onRewind: () => void | Promise<void>;
    onSkip: () => void | Promise<void>;
    onCycleSpeed: () => void;
    onOpenHistory: () => void;
    onOpenSettings: () => void;
    onOpenContents?: () => void;
    labels?: ReaderPlayerLabels;
};

const defaultLabels: Required<ReaderPlayerLabels> = {
    completeSuffix: '% complete',
    voice: 'Voice',
    back: 'Back',
    next: 'Next',
    speed: 'Speed',
    contents: 'Contents',
    bookmarks: 'Bookmarks',
    settings: 'Settings',
};

function formatClock(seconds: number | null | undefined, negative = false): string {
    if (!Number.isFinite(seconds) || seconds == null) {
        return '--:--';
    }

    const totalSeconds = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const remainder = totalSeconds % 60;
    const prefix = negative ? '-' : '';

    if (hours > 0) {
        return `${prefix}${hours}:${minutes.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
    }

    return `${prefix}${minutes}:${remainder.toString().padStart(2, '0')}`;
}

export function ReaderPlayer({
    colors,
    progressPct,
    playbackRate,
    elapsedSeconds,
    remainingSeconds,
    isPlaying,
    onPlayPause,
    onOpenVoices,
    onRewind,
    onSkip,
    onCycleSpeed,
    onOpenHistory,
    onOpenSettings,
    onOpenContents,
    labels,
}: ReaderPlayerProps) {
    const copy = { ...defaultLabels, ...labels };
    const clampedProgress = Math.max(0, Math.min(progressPct || 0, 100));
    const utilityActions = [
        onOpenContents
            ? {
                key: 'contents',
                label: copy.contents,
                icon: <LayoutList size={16} color={colors.mutedForeground} />,
                onPress: onOpenContents,
            }
            : null,
        {
            key: 'bookmarks',
            label: copy.bookmarks,
            icon: <BookmarkCheck size={16} color={colors.mutedForeground} />,
            onPress: onOpenHistory,
        },
        {
            key: 'settings',
            label: copy.settings,
            icon: <SlidersHorizontal size={16} color={colors.mutedForeground} />,
            onPress: onOpenSettings,
        },
    ].filter(Boolean) as Array<{ key: string; label: string; icon: React.ReactNode; onPress: () => void }>;

    return (
        <View
            style={[
                styles.bottomBar,
                {
                    backgroundColor: colors.surface,
                    borderTopColor: colors.border,
                    shadowColor: colors.foreground,
                },
            ]}
        >
            <ResponsiveContent widthVariant="reading">
                <View style={styles.progressSection}>
                    <View style={styles.progressRow}>
                        <Text style={[styles.progressTime, { color: colors.foreground }]}>{formatClock(elapsedSeconds)}</Text>
                        <Text style={[styles.progressPercent, { color: colors.mutedForeground }]}>
                            {Math.round(clampedProgress)}
                            {copy.completeSuffix}
                        </Text>
                        <Text style={[styles.progressTime, { color: colors.foreground }]}>{formatClock(remainingSeconds, true)}</Text>
                    </View>
                    <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
                        <View
                            style={[
                                styles.progressFill,
                                { width: `${clampedProgress}%`, backgroundColor: colors.primary },
                            ]}
                        />
                        <View
                            style={[
                                styles.progressKnob,
                                { backgroundColor: colors.primary, left: `${clampedProgress}%` },
                            ]}
                        />
                    </View>
                </View>

                <View style={styles.controlRow}>
                    <Pressable style={styles.controlAction} onPress={onOpenVoices}>
                        <Bot size={20} color={colors.mutedForeground} />
                        <Text style={[styles.controlLabel, { color: colors.mutedForeground }]}>{copy.voice}</Text>
                    </Pressable>

                    <Pressable style={styles.skipBtn} onPress={onRewind}>
                        <SkipBack size={22} color={colors.foreground} />
                        <Text style={[styles.skipLabel, { color: colors.mutedForeground }]}>{copy.back}</Text>
                    </Pressable>

                    <Pressable
                        style={[
                            styles.playPauseBtn,
                            { backgroundColor: colors.primary, shadowColor: colors.primary },
                        ]}
                        onPress={onPlayPause}
                    >
                        {isPlaying ? (
                            <Pause size={26} color={colors.background} fill={colors.background} />
                        ) : (
                            <Play
                                size={26}
                                color={colors.background}
                                fill={colors.background}
                                style={{ marginLeft: 3 }}
                            />
                        )}
                    </Pressable>

                    <Pressable style={styles.skipBtn} onPress={onSkip}>
                        <SkipForward size={22} color={colors.foreground} />
                        <Text style={[styles.skipLabel, { color: colors.mutedForeground }]}>{copy.next}</Text>
                    </Pressable>

                    <Pressable style={styles.controlAction} onPress={onCycleSpeed}>
                        <Text style={[styles.speedText, { color: colors.foreground }]}>{`${playbackRate}x`}</Text>
                        <Text style={[styles.controlLabel, { color: colors.mutedForeground }]}>{copy.speed}</Text>
                    </Pressable>
                </View>

                <View style={styles.utilityRow}>
                    {utilityActions.map((action) => (
                        <Pressable key={action.key} style={styles.utilityAction} onPress={action.onPress}>
                            {action.icon}
                            <Text style={[styles.utilityLabel, { color: colors.mutedForeground }]}>{action.label}</Text>
                        </Pressable>
                    ))}
                </View>
            </ResponsiveContent>
        </View>
    );
}

const styles = StyleSheet.create({
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
        gap: s[1],
    },
    skipLabel: {
        fontSize: 10,
        fontWeight: '600',
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
/**
 * AppHeader — reusable header for the entire app.
 *
 * Anatomy:
 *
 *  ┌─────────────────────────────────────────────────────┐
 *  │  [leftActions]   title / titleNode   [rightActions] │  ← main row
 *  │  subtitle                                           │  ← optional
 *  │  [tabs]                                             │  ← optional tab row
 *  └─────────────────────────────────────────────────────┘
 *
 * Usage examples
 * ──────────────
 * // Minimal title
 * <AppHeader title="Library" />
 *
 * // Back button + overflow menu
 * <AppHeader
 *   title="Book Details"
 *   leftActions={[{ icon: 'arrow-left', onPress: router.back, accessibilityLabel: 'Back' }]}
 *   rightActions={[{ icon: 'ellipsis-vertical', onPress: openMenu, accessibilityLabel: 'More options' }]}
 * />
 *
 * // Tabs (e.g. segmented control)
 * <AppHeader
 *   title="Search"
 *   tabs={[
 *     { label: 'All', value: 'all' },
 *     { label: 'Books', value: 'books' },
 *     { label: 'Authors', value: 'authors' },
 *   ]}
 *   activeTab="all"
 *   onTabChange={(v) => setTab(v)}
 * />
 *
 * // Custom title node
 * <AppHeader titleNode={<SearchInput />} />
 */

import { ReactNode } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
    type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { spacingTokens } from '@/styles/tokens/spacing';
import { typographyTokens } from '@/styles/tokens/typography';
import { useThemeColors } from '@/theme/useThemeColors';

// ─── Types ────────────────────────────────────────────────────────────────────

export type HeaderAction = {
    /** Any React node to render — an icon, text, avatar, etc. */
    node: ReactNode;
    onPress?: () => void;
    accessibilityLabel?: string;
    disabled?: boolean;
};

export type HeaderTab = {
    label: string;
    value: string;
};

export type AppHeaderProps = {
    // ── Title ──────────────────────────────────────────────
    /** Plain text title (ignored when `titleNode` is provided). */
    title?: string;
    /** Replace the title area with a fully custom node (e.g. a search input). */
    titleNode?: ReactNode;
    /** Optional subtitle shown beneath the title row. */
    subtitle?: string;

    // ── Action slots ───────────────────────────────────────
    /** Actions pinned to the left of the title. */
    leftActions?: HeaderAction[];
    /** Actions pinned to the right of the title. */
    rightActions?: HeaderAction[];

    // ── Tab row ────────────────────────────────────────────
    /** Tabs rendered as a scrollable row beneath the title. */
    tabs?: HeaderTab[];
    activeTab?: string;
    onTabChange?: (value: string) => void;

    // ── Appearance ─────────────────────────────────────────
    /** Override the background color (defaults to `colors.background`). */
    backgroundColor?: string;
    /** Show a bottom border separator. Default: true. */
    showBorder?: boolean;
    /** Override the entire container style. */
    style?: ViewStyle;
    /** Respect safe-area top inset. Default: true. */
    safeAreaTop?: boolean;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function AppHeader({
    title,
    titleNode,
    subtitle,
    leftActions = [],
    rightActions = [],
    tabs,
    activeTab,
    onTabChange,
    backgroundColor,
    showBorder = true,
    style,
    safeAreaTop = true,
}: AppHeaderProps) {
    const colors = useThemeColors();
    const insets = useSafeAreaInsets();

    const bg = backgroundColor ?? colors.background;
    const topPadding = safeAreaTop ? insets.top : 0;

    return (
        <View
            style={[
                styles.wrapper,
                { backgroundColor: bg, paddingTop: topPadding },
                showBorder && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
                style,
            ]}
        >
            {/* ── Main row ── */}
            <View style={styles.mainRow}>
                {/* Left actions */}
                {leftActions.length > 0 && (
                    <View style={styles.actionGroup}>
                        {leftActions.map((action, i) => (
                            <ActionButton key={i} action={action} colors={colors} />
                        ))}
                    </View>
                )}

                {/* Title area */}
                <View style={styles.titleArea}>
                    {titleNode ?? (
                        <Text
                            style={[styles.title, { color: colors.foreground }]}
                            numberOfLines={1}
                            accessibilityRole="header"
                        >
                            {title}
                        </Text>
                    )}
                    {subtitle ? (
                        <Text style={[styles.subtitle, { color: colors.mutedForeground }]} numberOfLines={1}>
                            {subtitle}
                        </Text>
                    ) : null}
                </View>

                {/* Right actions */}
                {rightActions.length > 0 && (
                    <View style={styles.actionGroup}>
                        {rightActions.map((action, i) => (
                            <ActionButton key={i} action={action} colors={colors} />
                        ))}
                    </View>
                )}
            </View>

            {/* ── Tab row ── */}
            {tabs && tabs.length > 0 && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabRow}
                >
                    {tabs.map((tab) => {
                        const isActive = tab.value === activeTab;
                        return (
                            <Pressable
                                key={tab.value}
                                onPress={() => onTabChange?.(tab.value)}
                                accessibilityRole="tab"
                                accessibilityState={{ selected: isActive }}
                                style={({ pressed }) => [
                                    styles.tab,
                                    isActive && { backgroundColor: colors.primary },
                                    !isActive && pressed && styles.tabPressed,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.tabLabel,
                                        {
                                            color: isActive ? colors.primaryForeground : colors.mutedForeground,
                                            fontWeight: isActive ? '600' : '400',
                                        },
                                    ]}
                                >
                                    {tab.label}
                                </Text>
                            </Pressable>
                        );
                    })}
                </ScrollView>
            )}
        </View>
    );
}

// ─── ActionButton ─────────────────────────────────────────────────────────────

type ActionButtonProps = {
    action: HeaderAction;
    colors: ReturnType<typeof useThemeColors>;
};

function ActionButton({ action, colors }: ActionButtonProps) {
    return (
        <Pressable
            onPress={action.onPress}
            disabled={action.disabled}
            accessibilityLabel={action.accessibilityLabel}
            accessibilityRole="button"
            accessibilityState={{ disabled: action.disabled ?? false }}
            style={({ pressed }) => [
                styles.actionBtn,
                {
                    borderColor: colors.border,
                    backgroundColor: pressed ? colors.muted : 'transparent',
                },
                action.disabled && styles.actionBtnDisabled,
            ]}
            hitSlop={spacingTokens[2]}
        >
            {action.node}
        </Pressable>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    wrapper: {
        width: '100%',
    },
    mainRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacingTokens[4],   // 16
        paddingVertical: spacingTokens[3],     // 12
        minHeight: spacingTokens[14],          // 56
        gap: spacingTokens[2],                 // 8
    },
    titleArea: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: typographyTokens.fontSize.lg,           // 18
        fontWeight: typographyTokens.fontWeight.semibold, // '600'
        letterSpacing: 0.4,
    },
    subtitle: {
        fontSize: typographyTokens.fontSize.sm,  // 14
        marginTop: 2,
    },
    actionGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacingTokens[1],  // 4
    },
    actionBtn: {
        // 40pt — meets comfortable touch-target guidance
        width: spacingTokens[10],
        height: spacingTokens[10],
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: spacingTokens[5],  // 20 — fully round
        borderWidth: StyleSheet.hairlineWidth,
    },
    actionBtnDisabled: {
        opacity: 0.4,
    },
    tabRow: {
        flexDirection: 'row',
        paddingHorizontal: spacingTokens[4],  // 16
        gap: spacingTokens[1],               // 4
        paddingBottom: spacingTokens[2],     // 8
    },
    tab: {
        paddingHorizontal: spacingTokens[3],  // 12
        paddingVertical: spacingTokens[1],    // 4
        borderRadius: 20,
    },
    tabPressed: {
        opacity: 0.6,
    },
    tabLabel: {
        fontSize: typographyTokens.fontSize.sm,  // 14
    },
});

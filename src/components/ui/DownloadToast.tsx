import { StyleSheet, Text, View } from 'react-native';

import { useAppTranslation } from '@/i18n/hooks';
import { useThemeColors } from '@/theme/useThemeColors';

interface DownloadToastProps {
    visible: boolean;
    label?: string;
    progress?: number; // 0–100
}

/**
 * Non-blocking download progress toast.
 * Render this in the root layout and pass a visible flag from a global store
 * when a model or document download is in progress.
 */
export function DownloadToast({ visible, label, progress }: DownloadToastProps) {
    const colors = useThemeColors();
    const { t } = useAppTranslation();

    if (!visible) return null;

    return (
        <View
            style={[
                styles.container,
                { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
        >
            <Text style={[styles.label, { color: colors.foreground }]} numberOfLines={1}>
                {label ?? t('common.downloading')}
            </Text>

            {progress !== undefined && (
                <View style={[styles.track, { backgroundColor: colors.muted }]}>
                    <View
                        style={[
                            styles.fill,
                            { backgroundColor: colors.primary, width: `${Math.min(progress, 100)}%` },
                        ]}
                    />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 90,
        left: 16,
        right: 16,
        borderRadius: 10,
        borderWidth: 1,
        padding: 12,
        gap: 8,
        shadowColor: 'black',
        shadowOpacity: 0.12,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 4,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
    },
    track: {
        height: 4,
        borderRadius: 2,
        overflow: 'hidden',
    },
    fill: {
        height: 4,
        borderRadius: 2,
    },
});

import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTranslation } from '@/i18n/hooks';
import { useThemeColors } from '@/theme/useThemeColors';

/**
 * Displays a non-intrusive banner at the top of the screen when the device
 * has no network connection. Offline TTS playback remains fully functional
 * when this banner is visible.
 *
 * NOTE: React Native's NetInfo is not bundled with Expo SDK 55 by default.
 * This component polls `fetch` with a lightweight probe URL as a workaround.
 * Replace with @react-native-community/netinfo if it is added to the project.
 */
const PROBE_URL = 'https://clients3.google.com/generate_204';
const POLL_INTERVAL_MS = 15_000;

async function probeConnection(): Promise<boolean> {
    try {
        const response = await fetch(PROBE_URL, {
            method: 'HEAD',
            cache: 'no-store',
        });
        return response.status === 204 || response.ok;
    } catch {
        return false;
    }
}

export function OfflineBanner() {
    const colors = useThemeColors();
    const { t } = useAppTranslation();
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const check = async () => {
            const online = await probeConnection();
            if (!cancelled) setIsOffline(!online);
        };

        void check();
        const id = setInterval(() => { void check(); }, POLL_INTERVAL_MS);
        return () => {
            cancelled = true;
            clearInterval(id);
        };
    }, []);

    if (!isOffline) return null;

    return (
        <View style={[styles.banner, { backgroundColor: colors.warning }]}>
            <Text style={[styles.text, { color: colors.foreground }]}>
                {t('common.offline_banner')}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    banner: {
        paddingVertical: 6,
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    text: {
        fontSize: 13,
        fontWeight: '500',
    },
});

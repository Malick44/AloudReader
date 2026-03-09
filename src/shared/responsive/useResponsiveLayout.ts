import { useMemo } from 'react';
import type { ViewStyle } from 'react-native';
import { useWindowDimensions } from 'react-native';

export const TABLET_MIN_WIDTH = 768;
export const LARGE_TABLET_MIN_WIDTH = 1100;

export type DeviceClass = 'phone' | 'tablet' | 'large-tablet';

export function useResponsiveLayout() {
    const { width, height } = useWindowDimensions();

    return useMemo(() => {
        const isLandscape = width > height;
        const isLargeTablet = width >= LARGE_TABLET_MIN_WIDTH;
        const isTablet = width >= TABLET_MIN_WIDTH;
        const deviceClass: DeviceClass = isLargeTablet ? 'large-tablet' : isTablet ? 'tablet' : 'phone';

        const screenPadding = isLargeTablet ? 32 : isTablet ? 24 : 16;
        const sectionGap = isLargeTablet ? 32 : isTablet ? 24 : 16;
        const contentMaxWidth = isLargeTablet ? 1280 : isTablet ? 980 : undefined;
        const formMaxWidth = isTablet ? 520 : undefined;
        const readingMaxWidth = isTablet ? 860 : undefined;
        const listColumns = isLargeTablet ? 3 : isTablet ? 2 : 1;
        const settingsColumns = isTablet ? 2 : 1;
        const shouldUseSplitView = isTablet;

        const makeCenteredWidth = (maxWidth?: number): ViewStyle => ({
            width: '100%',
            maxWidth,
            alignSelf: 'center',
        });

        return {
            width,
            height,
            isLandscape,
            isTablet,
            isLargeTablet,
            deviceClass,
            screenPadding,
            sectionGap,
            contentMaxWidth,
            formMaxWidth,
            readingMaxWidth,
            listColumns,
            settingsColumns,
            shouldUseSplitView,
            contentWidthStyle: makeCenteredWidth(contentMaxWidth),
            formWidthStyle: makeCenteredWidth(formMaxWidth),
            readingWidthStyle: makeCenteredWidth(readingMaxWidth),
        };
    }, [height, width]);
}

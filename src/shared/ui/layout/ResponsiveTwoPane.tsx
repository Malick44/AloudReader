import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useResponsiveLayout } from '@/shared/responsive/useResponsiveLayout';

type Props = {
    primary: ReactNode;
    secondary: ReactNode;
    primaryStyle?: StyleProp<ViewStyle>;
    secondaryStyle?: StyleProp<ViewStyle>;
    style?: StyleProp<ViewStyle>;
    primaryFlex?: number;
    secondaryFlex?: number;
};

export function ResponsiveTwoPane({
    primary,
    secondary,
    primaryStyle,
    secondaryStyle,
    style,
    primaryFlex = 1.2,
    secondaryFlex = 1,
}: Props) {
    const { shouldUseSplitView, sectionGap } = useResponsiveLayout();

    return (
        <View
            style={[
                styles.base,
                shouldUseSplitView ? styles.row : styles.column,
                { gap: sectionGap },
                style,
            ]}
        >
            <View style={[shouldUseSplitView && { flex: primaryFlex }, primaryStyle]}>{primary}</View>
            <View style={[shouldUseSplitView && { flex: secondaryFlex }, secondaryStyle]}>{secondary}</View>
        </View>
    );
}

const styles = StyleSheet.create({
    base: {
        width: '100%',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    column: {
        flexDirection: 'column',
    },
});

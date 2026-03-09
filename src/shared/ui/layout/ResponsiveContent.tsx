import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useResponsiveLayout } from '@/shared/responsive/useResponsiveLayout';

type WidthVariant = 'content' | 'form' | 'reading';

type Props = PropsWithChildren<{
    style?: StyleProp<ViewStyle>;
    widthVariant?: WidthVariant;
}>;

export function ResponsiveContent({ children, style, widthVariant = 'content' }: Props) {
    const { contentWidthStyle, formWidthStyle, readingWidthStyle } = useResponsiveLayout();

    const widthStyle =
        widthVariant === 'form'
            ? formWidthStyle
            : widthVariant === 'reading'
                ? readingWidthStyle
                : contentWidthStyle;

    return <View style={[styles.base, widthStyle, style]}>{children}</View>;
}

const styles = StyleSheet.create({
    base: {
        width: '100%',
        alignSelf: 'center',
    },
});

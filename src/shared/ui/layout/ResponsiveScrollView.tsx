import type { PropsWithChildren } from 'react';
import {
    ScrollView,
    StyleSheet,
    type ScrollViewProps,
    type StyleProp,
    type ViewStyle,
} from 'react-native';

import { useResponsiveLayout } from '@/shared/responsive/useResponsiveLayout';

import { ResponsiveContent } from './ResponsiveContent';

type WidthVariant = 'content' | 'form' | 'reading';

type Props = PropsWithChildren<ScrollViewProps & {
    innerStyle?: StyleProp<ViewStyle>;
    widthVariant?: WidthVariant;
    padded?: boolean;
    grow?: boolean;
}>;

export function ResponsiveScrollView({
    children,
    contentContainerStyle,
    innerStyle,
    widthVariant = 'content',
    padded = true,
    grow = true,
    ...props
}: Props) {
    const { screenPadding } = useResponsiveLayout();

    return (
        <ScrollView
            {...props}
            contentContainerStyle={[
                grow && styles.grow,
                padded && { paddingHorizontal: screenPadding, paddingVertical: screenPadding },
                contentContainerStyle,
            ]}
        >
            <ResponsiveContent widthVariant={widthVariant} style={innerStyle}>
                {children}
            </ResponsiveContent>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    grow: {
        flexGrow: 1,
    },
});

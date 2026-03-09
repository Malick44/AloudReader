import { PropsWithChildren } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { useThemeColors } from '@/theme/useThemeColors';

type CardProps = PropsWithChildren<{
  style?: ViewStyle;
}>;

export function Card({ style, children }: CardProps) {
  const colors = useThemeColors();
  return (
    <View style={[styles.container, { borderColor: colors.border, backgroundColor: colors.surface }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
  },
});

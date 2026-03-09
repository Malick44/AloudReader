import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { useThemeColors } from '@/theme/useThemeColors';

export type InputProps = TextInputProps;

export function Input({ style, ...props }: InputProps) {
  const colors = useThemeColors();
  return (
    <TextInput
      style={[
        styles.input,
        { borderColor: colors.input, backgroundColor: colors.background, color: colors.foreground },
        style,
      ]}
      placeholderTextColor={colors.mutedForeground}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
});

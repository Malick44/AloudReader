import { Pressable, StyleSheet, Text } from 'react-native';

import { useThemeColors } from '@/theme/useThemeColors';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
};

export function Button({ label, onPress, disabled = false, variant = 'primary' }: ButtonProps) {
  const colors = useThemeColors();

  const containerVariantStyle = {
    primary: { backgroundColor: colors.primary, borderColor: colors.primary },
    secondary: { backgroundColor: colors.secondary, borderColor: colors.secondary },
    ghost: { backgroundColor: 'transparent', borderColor: colors.border },
    destructive: { backgroundColor: colors.destructive, borderColor: colors.destructive },
  }[variant];

  const textVariantStyle = {
    primary: { color: colors.primaryForeground },
    secondary: { color: colors.secondaryForeground },
    ghost: { color: colors.foreground },
    destructive: { color: colors.destructiveForeground },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={[styles.container, containerVariantStyle, disabled && styles.disabled]}
      disabled={disabled}
      onPress={onPress}
    >
      <Text style={[styles.label, textVariantStyle]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
});

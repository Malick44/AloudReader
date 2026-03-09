import { PropsWithChildren, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { useThemeColors } from './useThemeColors';
import { useThemeStore } from './theme';

export function ThemeProvider({ children }: PropsWithChildren) {
  const hydrate = useThemeStore((state) => state.hydrate);
  const colors = useThemeColors();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, withAlpha } from '@/theme/colors';

type IllustrationCircleProps = {
  size?: number;
  children: ReactNode;
};

/** Círculo translúcido com o ícone do slide no centro. */
export function IllustrationCircle({ size = 240, children }: IllustrationCircleProps) {
  return <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>{children}</View>;
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(colors.primary, 0.12),
    borderWidth: 1,
    borderColor: withAlpha(colors.primary, 0.3),
  },
});

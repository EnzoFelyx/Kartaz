import type { ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { colors, withAlpha } from '@/theme/colors';

const SIZE = 44;

type IconButtonProps = {
  icon: ReactNode;
  accessibilityLabel: string;
  onPress: () => void;
  selected?: boolean;
};

/** Botão circular translúcido só com ícone (voltar, favoritar, compartilhar…). */
export function IconButton({ icon, accessibilityLabel, onPress, selected }: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={selected === undefined ? undefined : { selected }}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      {icon}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(colors.background, 0.65),
    borderWidth: 1,
    borderColor: withAlpha(colors.white, 0.1),
  },
  pressed: {
    transform: [{ scale: 0.92 }],
  },
});

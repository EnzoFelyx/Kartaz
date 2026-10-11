import type { ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { colors, withAlpha } from '@/theme/colors';

const DEFAULT_SIZE = 44;

type IconButtonProps = {
  icon: ReactNode;
  accessibilityLabel: string;
  onPress: () => void;
  selected?: boolean;
  /** Diâmetro do botão (padrão 44). */
  size?: number;
};

/** Botão circular translúcido só com ícone (voltar, favoritar, compartilhar…). */
export function IconButton({ icon, accessibilityLabel, onPress, selected, size = DEFAULT_SIZE }: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={selected === undefined ? undefined : { selected }}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.button,
        { width: size, height: size, borderRadius: size / 2 },
        pressed && styles.pressed,
      ]}>
      {icon}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
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

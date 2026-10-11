import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { colors, withAlpha } from '@/theme/colors';

/** "Mini expansão" ao tocar: cresce um pouco e volta com mola ao soltar. */
const PRESSED_SCALE = 1.05;
const SPRING = { damping: 14, stiffness: 260, mass: 0.6 };

type StatCardProps = {
  /** Cor do card (hex #rrggbb): fundo e borda translúcidos e cor do ícone. */
  color: string;
  icon: ReactNode;
  value: string;
  label: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

/** Card de estatística do perfil (ícone, valor e rótulo) com animação de toque. */
export function StatCard({ color, icon, value, label, onPress, style }: StatCardProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : 'summary'}
      accessibilityLabel={`${value} ${label}`}
      onPress={onPress}
      onPressIn={() => scale.set(withSpring(PRESSED_SCALE, SPRING))}
      onPressOut={() => scale.set(withSpring(1, SPRING))}
      style={style}>
      <Animated.View
        style={[
          styles.card,
          { backgroundColor: withAlpha(color, 0.16), borderColor: withAlpha(color, 0.32) },
          animatedStyle,
        ]}>
        {icon}
        <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 8,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
  },
  value: {
    marginTop: 4,
    color: colors.foreground,
    fontSize: 28,
    fontWeight: '800',
  },
  label: {
    color: colors.secondaryForeground,
    fontSize: 14,
  },
});

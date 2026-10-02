import { useEffect } from 'react';
import { StyleSheet, type ColorValue } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { colors } from '@/theme/colors';

type ActivityIndicatorDotProps = {
  active: boolean;
  color?: ColorValue;
  size?: number;
};

/**
 * Bolinha que indica a aba ativa. Fica sempre montada e só anima
 * opacidade/escala, para o ícone acima não mudar de posição.
 */
export function ActivityIndicatorDot({
  active,
  color = colors.primary,
  size = 5,
}: ActivityIndicatorDotProps) {
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, { duration: 200 });
  }, [active, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: progress.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          shadowColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  dot: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
  },
});

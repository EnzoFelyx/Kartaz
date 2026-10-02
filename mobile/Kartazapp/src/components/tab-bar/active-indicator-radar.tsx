import { useEffect } from 'react';
import { StyleSheet, View, type ColorValue } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { colors } from '@/theme/colors';

const WAVE_COUNT = 3;

type ActiveIndicatorRadarProps = {
  color?: ColorValue;
  /** Diâmetro máximo da onda. */
  size?: number;
  /** Duração de um ciclo completo de cada onda (ms). */
  duration?: number;
  /** Opacidade do preenchimento da onda (mesma cor da borda). */
  fillOpacity?: number;
};

/**
 * Efeito radar: 3 ondas que se propagam do centro para fora.
 * Todas compartilham o mesmo relógio linear (0 → 1, em loop) e cada onda
 * fica defasada 120° (1/3 do ciclo) da anterior, então a animação é contínua.
 */
export function ActiveIndicatorRadar({
  color = colors.primary,
  size = 44,
  duration = 2600,
  fillOpacity = 0.8,
}: ActiveIndicatorRadarProps) {
  const clock = useSharedValue(0);

  useEffect(() => {
    clock.value = withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(clock);
  }, [clock, duration]);

  return (
    <View pointerEvents="none" style={[styles.container, { width: size, height: size }]}>
      {Array.from({ length: WAVE_COUNT }, (_, index) => (
        <RadarWave
          key={index}
          clock={clock}
          phase={index / WAVE_COUNT}
          color={color}
          size={size}
          fillOpacity={fillOpacity}
        />
      ))}
    </View>
  );
}

type RadarWaveProps = {
  clock: SharedValue<number>;
  /** Defasagem em fração do ciclo (1/3 = 120°). */
  phase: number;
  color: ColorValue;
  size: number;
  fillOpacity: number;
};

function RadarWave({ clock, phase, color, size, fillOpacity }: RadarWaveProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const progress = (clock.value + phase) % 1;
    return {
      // Nasce pequena no centro e expande até o diâmetro total.
      transform: [{ scale: interpolate(progress, [0, 1], [0.2, 1], Extrapolation.CLAMP) }],
      // Surge rápido (evita "pop") e some gradualmente enquanto se afasta do centro.
      opacity: interpolate(progress, [0, 0.15, 1], [0, 0.7, 0], Extrapolation.CLAMP),
    };
  });

  return (
    <Animated.View
      style={[styles.wave, { width: size, height: size, borderRadius: size / 2 }, animatedStyle]}>
      {/* Preenchimento na cor do radar (translúcido para o ícone continuar visível por cima). */}
      <View
        style={[
          styles.layer,
          { width: size, height: size, borderRadius: size / 2 },
          { backgroundColor: color, opacity: fillOpacity },
        ]}
      />
      {/* Borda da onda. */}
      <View
        style={[
          styles.layer,
          styles.border,
          { width: size, height: size, borderRadius: size / 2, borderColor: color },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wave: {
    position: 'absolute',
  },
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  border: {
    borderWidth: 1.5,
  },
});

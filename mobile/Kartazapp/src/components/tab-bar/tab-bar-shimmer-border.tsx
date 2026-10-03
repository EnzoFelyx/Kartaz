import {
  BlurMask,
  Canvas,
  LinearGradient,
  Path,
  RoundedRect,
  Skia,
  SweepGradient,
  vec,
} from '@shopify/react-native-skia';
import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  cancelAnimation,
  Easing,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/theme/colors';

type ShimmerVariant = 'sweep' | 'trace';

type TabBarShimmerBorderProps = {
  width: number;
  height: number;
  radius: number;
  strokeWidth?: number;
  /** Duração de uma volta completa do brilho (ms). */
  duration?: number;
  /**
   * - `trace`: um trecho brilhante percorre o contorno com velocidade constante.
   * - `sweep` (padrão): um SweepGradient gira em volta do centro (mais rápido nas pontas arredondadas).
   */
  variant?: ShimmerVariant;
  /** Comprimento do trecho brilhante no modo `trace` (fração do perímetro, 0–1). */
  segmentLength?: number;
};

/**
 * Borda da tab bar desenhada com Skia: traço fino com gradiente ciano → roxo → ciano
 * e um brilho (shimmer) animado em volta.
 */
export function TabBarShimmerBorder({
  width,
  height,
  radius,
  strokeWidth = 1,
  duration = 4000,
  variant = 'sweep',
  segmentLength = 0.12,
}: TabBarShimmerBorderProps) {
  const clock = useSharedValue(0);

  useEffect(() => {
    clock.value = withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(clock);
  }, [clock, duration]);

  // Recuo de meio traço para a borda não ser cortada pelo Canvas.
  const inset = strokeWidth / 2;
  const rect = {
    x: inset,
    y: inset,
    width: width - strokeWidth,
    height: height - strokeWidth,
    r: radius - inset,
  };
  const center = vec(width / 2, height / 2);

  const borderPath = useMemo(
    () =>
      Skia.Path.RRect(
        Skia.RRectXY(
          Skia.XYWHRect(inset, inset, width - strokeWidth, height - strokeWidth),
          radius - inset,
          radius - inset,
        ),
      ),
    [width, height, radius, inset, strokeWidth],
  );

  // Modo `trace`: o trecho [clock, clock + segmentLength] percorre o caminho.
  // Quando passa do fim (1), a sobra é desenhada a partir do início (0) num segundo Path.
  const headStart = useDerivedValue(() => clock.value);
  const headEnd = useDerivedValue(() => Math.min(clock.value + segmentLength, 1));
  const tailEnd = useDerivedValue(() => Math.max(clock.value + segmentLength - 1, 0));
  // Esconde o segundo trecho quando ele tem comprimento zero (a ponta redonda viraria um ponto).
  const tailOpacity = useDerivedValue(() => (clock.value + segmentLength > 1 ? 1 : 0));

  const rotation = useDerivedValue(() => [{ rotate: clock.value * 2 * Math.PI }]);

  if (width === 0) return null;

  return (
    <View pointerEvents="none" style={[styles.container, { width, height }]}>
      <Canvas style={{ width, height }}>
        <RoundedRect {...rect} style="stroke" strokeWidth={strokeWidth} opacity={0.25}>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(width, 0)}
            colors={[colors.primary, colors.violet, colors.primary]}
          />
        </RoundedRect>

        {variant === 'sweep' ? (
          <RoundedRect {...rect} style="stroke" strokeWidth={strokeWidth}>
            <SweepGradient
              c={center}
              origin={center}
              transform={rotation}
              colors={[
                colors.transparent,
                colors.transparent,
                colors.primary,
                colors.white,
                colors.primary,
                colors.transparent,
              ]}
              positions={[0, 0.78, 0.86, 0.9, 0.94, 1]}
            />
          </RoundedRect>
        ) : (
          <>
            {/* Halo ciano desfocado */}
            {[
              { start: headStart, end: headEnd, opacity: 1 },
              { start: 0, end: tailEnd, opacity: tailOpacity },
            ].map((segment, index) => (
              <Path
                key={`glow-${index}`}
                path={borderPath}
                start={segment.start}
                end={segment.end}
                opacity={segment.opacity}
                style="stroke"
                strokeWidth={strokeWidth * 2.5}
                strokeCap="round"
                color={colors.primary}>
                <BlurMask blur={4} style="solid" />
              </Path>
            ))}
            {/* Núcleo claro do brilho */}
            {[
              { start: headStart, end: headEnd, opacity: 1 },
              { start: 0, end: tailEnd, opacity: tailOpacity },
            ].map((segment, index) => (
              <Path
                key={`core-${index}`}
                path={borderPath}
                start={segment.start}
                end={segment.end}
                opacity={segment.opacity}
                style="stroke"
                strokeWidth={strokeWidth}
                strokeCap="round"
                color={colors.white}
              />
            ))}
          </>
        )}
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});

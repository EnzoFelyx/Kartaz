import { Canvas, Group, LinearGradient, Rect, vec } from '@shopify/react-native-skia';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colors as themeColors, withAlpha } from '@/theme/colors';

type ProgressBarProps = {
  /** Progresso de 0 a 1. */
  progress: number;
  height?: number;
  /** Cores do gradiente da barra (esquerda → direita). */
  colors?: string[];
  /** Cor do glow em volta do preenchimento. */
  glowColor?: string;
  trackColor?: string;
  /**
   * Pulso de energia que percorre a barra do início (0%) até a ponta do preenchimento,
   * em loop, dando a impressão de que a barra "quer" encher.
   */
  pulse?: boolean;
  /** Atraso (ms) antes de a barra começar a encher (ex.: entrada em sequência de uma tela). */
  fillDelay?: number;
};

/** Largura da faixa de luz do pulso (px). */
const PULSE_BAND = 48;
/** Tempo para o pulso atravessar a barra inteira (100%); proporcional ao preenchido. */
const PULSE_FULL_MS = 1400;
const PULSE_MIN_MS = 450;
/** Pausa entre um pulso e o próximo. */
const PULSE_GAP_MS = 500;

/**
 * Barra de progresso com gradiente (Skia) e glow, como `.progress-bar` do protótipo.
 * O gradiente ocupa a trilha inteira e o preenchimento só revela a parte atual,
 * então a cor final da barra muda conforme ela enche. Anima ao mudar o progresso.
 */
export function ProgressBar({
  progress,
  height = 6,
  colors = [themeColors.primary, themeColors.progressEnd],
  glowColor = themeColors.primary,
  trackColor = themeColors.track,
  pulse = false,
  fillDelay = 0,
}: ProgressBarProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const animatedProgress = useSharedValue(0);
  const pulseValue = useSharedValue(0);
  const clamped = Math.min(Math.max(progress, 0), 1);

  useEffect(() => {
    const fill = withTiming(clamped, { duration: 700 });
    animatedProgress.value = fillDelay > 0 ? withDelay(fillDelay, fill) : fill;
  }, [clamped, fillDelay, animatedProgress]);

  useEffect(() => {
    if (!pulse || clamped === 0) {
      cancelAnimation(pulseValue);
      pulseValue.value = 0;
      return;
    }
    // Velocidade constante: quanto mais preenchida, mais longo o percurso.
    const duration = Math.max(PULSE_MIN_MS, PULSE_FULL_MS * clamped);
    pulseValue.value = 0;
    pulseValue.value = withRepeat(
      withDelay(PULSE_GAP_MS, withTiming(1, { duration, easing: Easing.inOut(Easing.quad) })),
      -1,
      false,
    );
    return () => cancelAnimation(pulseValue);
  }, [pulse, clamped, pulseValue]);

  const fillStyle = useAnimatedStyle(() => ({
    width: trackWidth * animatedProgress.value,
  }));

  // A faixa sai de fora da esquerda (0%) e termina saindo pela ponta do preenchimento.
  const pulseTransform = useDerivedValue(() => {
    const fillWidth = trackWidth * animatedProgress.value;
    const x = -PULSE_BAND + pulseValue.value * (fillWidth + PULSE_BAND);
    return [{ translateX: x }];
  });

  const radius = height / 2;

  return (
    <View
      style={[styles.track, { height, borderRadius: radius, backgroundColor: trackColor }]}
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}>
      <Animated.View
        style={[styles.glow, { height, borderRadius: radius, shadowColor: glowColor }, fillStyle]}>
        <View style={[styles.clip, { height, borderRadius: radius }]}>
          {trackWidth > 0 && (
            <Canvas style={{ width: trackWidth, height }}>
              <Rect x={0} y={0} width={trackWidth} height={height}>
                <LinearGradient start={vec(0, 0)} end={vec(trackWidth, 0)} colors={colors} />
              </Rect>

              {pulse && (
                <Group transform={pulseTransform}>
                  <Rect x={0} y={0} width={PULSE_BAND} height={height}>
                    <LinearGradient
                      start={vec(0, 0)}
                      end={vec(PULSE_BAND, 0)}
                      colors={[
                        withAlpha(themeColors.white, 0),
                        themeColors.highlight,
                        withAlpha(themeColors.white, 0),
                      ]}
                    />
                  </Rect>
                </Group>
              )}
            </Canvas>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
  },
  glow: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
  clip: {
    width: '100%',
    overflow: 'hidden',
  },
});

import { useEffect, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';

import { colors } from '@/theme/colors';

const THUMB_SIZE = 26;
const TRACK_HEIGHT = 8;

type RangeSliderProps = {
  min: number;
  max: number;
  /** Valores atuais (inteiros, `low <= high`). */
  low: number;
  high: number;
  /** Ao soltar o thumb: novos valores. */
  onChange: (low: number, high: number) => void;
  /** Durante o arraste, a cada valor inteiro novo (para o texto acompanhar ao vivo). */
  onSlide?: (low: number, high: number) => void;
  accessibilityLabel?: string;
};

/**
 * Slider de faixa: um trilho com dois thumbs (mínimo e máximo) e o preenchimento em gradiente entre
 * eles, de centro a centro dos thumbs. O toque pega o thumb mais perto; os thumbs não se cruzam.
 * Arraste na thread de UI (gesture-handler + Reanimated); o JS só recebe os valores inteiros.
 */
export function RangeSlider({ min, max, low, high, onChange, onSlide, accessibilityLabel }: RangeSliderProps) {
  const [width, setWidth] = useState(0);
  /** Espaço que o thumb percorre (a largura menos o próprio thumb). */
  const usable = useSharedValue(0);
  const lowX = useSharedValue(0);
  const highX = useSharedValue(0);
  /** Thumb do arraste atual: 0 = mínimo, 1 = máximo. */
  const active = useSharedValue(0);
  const startX = useSharedValue(0);
  const lastLow = useSharedValue(low);
  const lastHigh = useSharedValue(high);
  const span = Math.max(1, max - min);

  // Valores vindos de fora (abrir o modal, "Limpar") reposicionam os thumbs.
  useEffect(() => {
    const room = Math.max(0, width - THUMB_SIZE);
    usable.set(room);
    lowX.set(((low - min) / span) * room);
    highX.set(((high - min) / span) * room);
    lastLow.set(low);
    lastHigh.set(high);
  }, [width, low, high, min, span, usable, lowX, highX, lastLow, lastHigh]);

  const pan = Gesture.Pan()
    .minDistance(0)
    .onBegin((event) => {
      const touch = event.x - THUMB_SIZE / 2;
      const lowDistance = Math.abs(touch - lowX.value);
      const highDistance = Math.abs(touch - highX.value);
      // Thumbs empilhados: no fim do trilho só dá para mexer o mínimo; no resto, o máximo.
      const pickHigh = lowDistance === highDistance ? highX.value < usable.value : highDistance < lowDistance;
      active.set(pickHigh ? 1 : 0);
      startX.set(pickHigh ? highX.value : lowX.value);
    })
    .onUpdate((event) => {
      const room = usable.value;
      if (room <= 0) return;
      const next = startX.value + event.translationX;
      if (active.value === 1) {
        highX.set(Math.min(room, Math.max(lowX.value, next)));
      } else {
        lowX.set(Math.max(0, Math.min(highX.value, next)));
      }
      const nextLow = Math.round((lowX.value / room) * span) + min;
      const nextHigh = Math.round((highX.value / room) * span) + min;
      if (nextLow !== lastLow.value || nextHigh !== lastHigh.value) {
        lastLow.set(nextLow);
        lastHigh.set(nextHigh);
        if (onSlide) scheduleOnRN(onSlide, nextLow, nextHigh);
      }
    })
    .onFinalize(() => {
      const room = usable.value;
      if (room <= 0) return;
      // Encaixa nos inteiros e confirma.
      lowX.set(((lastLow.value - min) / span) * room);
      highX.set(((lastHigh.value - min) / span) * room);
      scheduleOnRN(onChange, lastLow.value, lastHigh.value);
    });

  const fillStyle = useAnimatedStyle(() => ({
    left: lowX.value + THUMB_SIZE / 2,
    width: Math.max(0, highX.value - lowX.value),
  }));
  const lowThumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: lowX.value }] }));
  const highThumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: highX.value }] }));

  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

  return (
    <GestureDetector gesture={pan}>
      <View
        style={styles.container}
        onLayout={onLayout}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{ text: `${low} – ${high}` }}>
        <View style={styles.track} />
        <Animated.View style={[styles.fill, fillStyle]}>
          <Svg width="100%" height="100%" preserveAspectRatio="none">
            <Defs>
              <LinearGradient id="rangeFill" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={colors.primary} />
                <Stop offset="1" stopColor={colors.progressEnd} />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#rangeFill)" />
          </Svg>
        </Animated.View>
        <Animated.View style={[styles.thumb, lowThumbStyle]} />
        <Animated.View style={[styles.thumb, highThumbStyle]} />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    height: THUMB_SIZE + 8,
    justifyContent: 'center',
  },
  track: {
    position: 'absolute',
    left: THUMB_SIZE / 2,
    right: THUMB_SIZE / 2,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: colors.track,
  },
  fill: {
    position: 'absolute',
    height: TRACK_HEIGHT,
    overflow: 'hidden',
    borderRadius: TRACK_HEIGHT / 2,
  },
  thumb: {
    position: 'absolute',
    left: 0,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: colors.white,
    borderWidth: 3,
    borderColor: colors.primary,
    shadowColor: colors.shadow,
    shadowOpacity: 0.35,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
});

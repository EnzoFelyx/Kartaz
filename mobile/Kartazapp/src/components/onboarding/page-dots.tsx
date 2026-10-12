import { StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

import { colors, withAlpha } from '@/theme/colors';

const DOT_SIZE = 8;
const ACTIVE_WIDTH = 36;
// Calculada fora do worklet: `withAlpha` é uma função JS comum e não pode rodar na thread de UI.
const INACTIVE_COLOR = withAlpha(colors.white, 0.25);

type PageDotsProps = {
  count: number;
  /** Offset horizontal do carrossel (px). */
  scrollX: SharedValue<number>;
  pageWidth: number;
};

/** Indicador de página: o ponto ativo vira uma pílula e acompanha o dedo durante o swipe. */
export function PageDots({ count, scrollX, pageWidth }: PageDotsProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: count }, (_, index) => (
        <Dot key={index} index={index} scrollX={scrollX} pageWidth={pageWidth} />
      ))}
    </View>
  );
}

function Dot({ index, scrollX, pageWidth }: { index: number; scrollX: SharedValue<number>; pageWidth: number }) {
  const style = useAnimatedStyle(() => {
    const page = pageWidth > 0 ? scrollX.value / pageWidth : 0;
    const distance = Math.abs(page - index);
    return {
      width: interpolate(distance, [0, 1], [ACTIVE_WIDTH, DOT_SIZE], Extrapolation.CLAMP),
      backgroundColor: interpolateColor(Math.min(distance, 1), [0, 1], [colors.primary, INACTIVE_COLOR]),
    };
  });

  return <Animated.View style={[styles.dot, style]} />;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
});

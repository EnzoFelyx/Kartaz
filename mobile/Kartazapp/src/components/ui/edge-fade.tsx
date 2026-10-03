import { Canvas, LinearGradient, Rect, vec } from '@shopify/react-native-skia';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, withAlpha } from '@/theme/colors';

type EdgeFadeProps = {
  /** Borda onde o fade fica (o conteúdo "some" nessa direção). */
  edge?: 'top' | 'bottom';
  height?: number;
  /** Cor do fundo onde o conteúdo se dissolve (hex #rrggbb). */
  color?: string;
};

/**
 * Faixa em gradiente (Skia) sobre a borda de uma área rolável:
 * o conteúdo que passa por baixo vai sumindo no fundo. Não captura toques.
 */
export function EdgeFade({ edge = 'top', height = 32, color = colors.background }: EdgeFadeProps) {
  const [width, setWidth] = useState(0);
  const solid = color;
  const clear = withAlpha(color, 0);

  return (
    <View
      pointerEvents="none"
      style={[styles.container, { height }, edge === 'top' ? styles.top : styles.bottom]}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <Canvas style={{ width, height }}>
          <Rect x={0} y={0} width={width} height={height}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, height)}
              colors={edge === 'top' ? [solid, clear] : [clear, solid]}
            />
          </Rect>
        </Canvas>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  top: {
    top: 0,
  },
  bottom: {
    bottom: 0,
  },
});

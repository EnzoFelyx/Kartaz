import { Canvas, LinearGradient, RoundedRect, vec } from '@shopify/react-native-skia';
import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';

type GradientBorderProps = {
  /** Cores do gradiente diagonal da borda (uma cor repetida = borda sólida). */
  colors: string[];
  radius: number;
  width?: number;
};

/**
 * Borda em gradiente (Skia) que ocupa o pai inteiro: coloque como primeiro filho de uma view
 * com `borderRadius` igual ao `radius`. Mede o pai sozinha.
 */
export function GradientBorder({ colors, radius, width = 1.5 }: GradientBorderProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const inset = width / 2;

  const onLayout = (event: LayoutChangeEvent) => {
    const layout = event.nativeEvent.layout;
    setSize({ width: layout.width, height: layout.height });
  };

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} onLayout={onLayout}>
      {size.width > 0 && (
        <Canvas style={StyleSheet.absoluteFill}>
          <RoundedRect
            x={inset}
            y={inset}
            width={size.width - width}
            height={size.height - width}
            r={radius - inset}
            style="stroke"
            strokeWidth={width}>
            <LinearGradient start={vec(0, 0)} end={vec(size.width, size.height)} colors={colors} />
          </RoundedRect>
        </Canvas>
      )}
    </View>
  );
}

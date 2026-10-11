import { Canvas, LinearGradient, RoundedRect, vec } from '@shopify/react-native-skia';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

type GradientBoxProps = {
  width: number;
  height: number;
  /** Raio dos cantos (use metade do lado para um círculo). */
  radius: number;
  /** Cores do gradiente diagonal (canto superior esquerdo → inferior direito). */
  colors: string[];
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Caixa com fundo em gradiente diagonal (Skia) e conteúdo centralizado por cima. */
export function GradientBox({ width, height, radius, colors, children, style }: GradientBoxProps) {
  return (
    <View style={[styles.box, { width, height, borderRadius: radius }, style]}>
      <Canvas style={StyleSheet.absoluteFill}>
        <RoundedRect x={0} y={0} width={width} height={height} r={radius}>
          <LinearGradient start={vec(0, 0)} end={vec(width, height)} colors={colors} />
        </RoundedRect>
      </Canvas>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});

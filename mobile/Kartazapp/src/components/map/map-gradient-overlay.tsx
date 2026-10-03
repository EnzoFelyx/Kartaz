import { Canvas, LinearGradient, Rect, vec } from '@shopify/react-native-skia';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, withAlpha } from '@/theme/colors';

type MapGradientOverlayProps = {
  /** Cor do escurecimento (hex #rrggbb). */
  color?: string;
  topOpacity?: number;
  bottomOpacity?: number;
  /** Até onde (fração da altura) o escurecimento do topo vai sumindo. */
  topFade?: number;
  /** Quanto (fração da altura) da base recebe o escurecimento. */
  bottomFade?: number;
};

/**
 * Gradiente vertical por cima do mapa (Skia): escurece o topo (HUD) e a base
 * (Scan Area + tab bar), deixando o centro do mapa nítido.
 * Não captura toques: o mapa continua arrastável por baixo.
 */
export function MapGradientOverlay({
  color = colors.background,
  topOpacity = 0.95,
  bottomOpacity = 0.97,
  topFade = 0.2,
  bottomFade = 0.2,
}: MapGradientOverlayProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setSize({ width, height });
      }}>
      {size.width > 0 && (
        <Canvas style={{ width: size.width, height: size.height }}>
          <Rect x={0} y={0} width={size.width} height={size.height}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, size.height)}
              colors={[
                withAlpha(color, topOpacity),
                withAlpha(color, 0),
                withAlpha(color, 0),
                withAlpha(color, bottomOpacity),
              ]}
              positions={[0, topFade, 1 - bottomFade, 1]}
            />
          </Rect>
        </Canvas>
      )}
    </View>
  );
}

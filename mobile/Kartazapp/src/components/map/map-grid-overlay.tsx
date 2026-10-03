import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Path, Pattern, Rect } from 'react-native-svg';

import { mapPalette } from '@/theme/map-styles';

type MapGridOverlayProps = {
  /** Tamanho de cada célula do grid (px). */
  cellSize?: number;
  color?: string;
  strokeWidth?: number;
};

/**
 * Grid fixo por cima do mapa (equivalente ao `.map-grid` do protótipo).
 * Não captura toques: o mapa continua arrastável por baixo.
 */
export function MapGridOverlay({
  cellSize = 40,
  color = mapPalette.gridLine,
  strokeWidth = 1,
}: MapGridOverlayProps) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id="map-grid" width={cellSize} height={cellSize} patternUnits="userSpaceOnUse">
            {/* Linha superior + linha esquerda de cada célula formam o grid. */}
            <Path
              d={`M ${cellSize} 0 L 0 0 0 ${cellSize}`}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
            />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#map-grid)" />
      </Svg>
    </View>
  );
}

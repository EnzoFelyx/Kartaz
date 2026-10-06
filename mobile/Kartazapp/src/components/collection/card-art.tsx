import { Canvas, LinearGradient, Line, Rect, vec } from '@shopify/react-native-skia';
import { useState } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import type { Rarity } from '@/types/player-card';
import { colors, rarityColors, withAlpha } from '@/theme/colors';
import { getNationShortCode, getPositionLabel } from '@/utils/card-labels';

import { CardArtwork } from './card-artwork';

const GRID_STEP = 20;

type CardArtProps = {
  rarity: Rarity;
  /** Seleção do jogador (nome ou código); a arte mostra a sigla. */
  nation: string;
  position: string;
  /** Foto do jogador: com ela, a arte vira o fundo de carta do grid com a foto por cima. */
  imageUri?: string;
  /** Tamanho do código da seleção (escala com o tamanho da arte). */
  codeSize?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Arte da carta.
 * - Com foto: o mesmo fundo do grid (`CardArtwork`, do projeto de referência), em que a foto
 *   transparente do jogador se mistura com o fundo da carta.
 * - Sem foto: placeholder Skia com gradiente na cor da raridade, grid sutil e a sigla da seleção.
 */
export function CardArt({ rarity, nation, position, imageUri, codeSize = 44, style }: CardArtProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  if (imageUri) {
    return <CardArtwork uri={imageUri} style={style} pointerEvents="none" />;
  }

  const tint = rarityColors[rarity];

  const verticals = Array.from({ length: Math.ceil(size.width / GRID_STEP) }, (_, i) => (i + 1) * GRID_STEP);
  const horizontals = Array.from({ length: Math.ceil(size.height / GRID_STEP) }, (_, i) => (i + 1) * GRID_STEP);
  const gridColor = withAlpha(colors.white, 0.04);

  return (
    <View
      style={[styles.container, style]}
      onLayout={(e) => setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}>
      {size.width > 0 && (
        <Canvas style={StyleSheet.absoluteFill}>
          <Rect x={0} y={0} width={size.width} height={size.height}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, size.height)}
              colors={[withAlpha(tint, 0.35), withAlpha(colors.secondary, 0.9), colors.card]}
            />
          </Rect>
          {verticals.map((x) => (
            <Line key={`v${x}`} p1={vec(x, 0)} p2={vec(x, size.height)} color={gridColor} strokeWidth={1} />
          ))}
          {horizontals.map((y) => (
            <Line key={`h${y}`} p1={vec(0, y)} p2={vec(size.width, y)} color={gridColor} strokeWidth={1} />
          ))}
        </Canvas>
      )}

      <Text style={[styles.code, { fontSize: codeSize, color: withAlpha(tint, 0.35) }]}>
        {getNationShortCode(nation)}
      </Text>
      <Text style={[styles.position, { color: tint }]}>{getPositionLabel(position)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  code: {
    fontWeight: '900',
    letterSpacing: 2,
  },
  position: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
});

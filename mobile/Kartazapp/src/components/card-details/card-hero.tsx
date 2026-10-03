import { Canvas, LinearGradient, Rect, vec } from '@shopify/react-native-skia';
import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { CardArt } from '@/components/collection/card-art';
import type { PlayerCard } from '@/types/player-card';
import { colors, withAlpha } from '@/theme/colors';

type CardHeroProps = {
  card: PlayerCard;
  height: number;
  /** Conteúdo sobreposto na base da arte (badges, nome, rating). */
  children?: ReactNode;
};

/**
 * Topo da tela de detalhes: arte grande da carta (Skia) que se dissolve
 * no fundo do app, com o conteúdo do jogador por cima.
 */
export function CardHero({ card, height, children }: CardHeroProps) {
  const [width, setWidth] = useState(0);

  return (
    <View style={{ height }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <CardArt
        rarity={card.rarity}
        nationCode={card.nationCode}
        position={card.position}
        codeSize={120}
        style={StyleSheet.absoluteFill}
      />

      {width > 0 && (
        <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
          <Rect x={0} y={0} width={width} height={height}>
            <LinearGradient
              start={vec(0, height * 0.35)}
              end={vec(0, height)}
              colors={[withAlpha(colors.background, 0), colors.background]}
            />
          </Rect>
        </Canvas>
      )}

      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 8,
  },
});

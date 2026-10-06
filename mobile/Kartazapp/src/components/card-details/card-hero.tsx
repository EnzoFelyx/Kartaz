import { Canvas, LinearGradient, Rect, vec } from '@shopify/react-native-skia';
import { Image } from 'expo-image';
import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { PlayerPhoto } from '@/components/collection/player-photo';
import type { Player } from '@/types/player-card';
import { colors, withAlpha } from '@/theme/colors';

const DETAILS_BACKGROUND = require('../../../assets/images/bg-card-details.png');

/** Faixa do topo ocupada pela foto (fração da altura), acima do nome e dos badges. */
const PHOTO_TOP = 0.1;
const PHOTO_HEIGHT = 0.62;

type CardHeroProps = {
  card: Player;
  height: number;
  /** Conteúdo sobreposto na base da arte (badges, nome, rating). */
  children?: ReactNode;
};

/**
 * Topo da tela de detalhes: fundo de arena (`bg-card-details.png`, do projeto de referência)
 * com a foto do jogador por cima. A foto tem fundo transparente e se mistura com a arena;
 * um degradê dissolve tudo no fundo do app, com o conteúdo do jogador por cima.
 */
export function CardHero({ card, height, children }: CardHeroProps) {
  const [width, setWidth] = useState(0);

  return (
    <View style={[styles.hero, { height }]} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <Image source={DETAILS_BACKGROUND} style={StyleSheet.absoluteFill} contentFit="cover" transition={0} />

      <View style={[styles.photo, { top: height * PHOTO_TOP, height: height * PHOTO_HEIGHT }]} pointerEvents="none">
        <PlayerPhoto key={card.imageUri} uri={card.imageUri} contentFit="contain" />
      </View>

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
  hero: {
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  photo: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  content: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 8,
  },
});

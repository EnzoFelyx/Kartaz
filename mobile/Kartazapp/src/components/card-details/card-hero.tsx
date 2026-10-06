import { Canvas, LinearGradient, Rect, vec } from '@shopify/react-native-skia';
import { Image } from 'expo-image';
import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, withAlpha } from '@/theme/colors';

const DETAILS_BACKGROUND = require('../../../assets/images/bg-card-details.png');

type CardHeroProps = {
  height: number;
  /** Conteúdo sobreposto na base do topo (badges, nome, foto da carta, descoberta global). */
  children?: ReactNode;
};

/**
 * Topo da tela de detalhes (layout do projeto de referência): fundo de arena
 * (`bg-card-details.png`) que se dissolve no fundo do app, com o conteúdo do jogador por cima.
 */
export function CardHero({ height, children }: CardHeroProps) {
  const [width, setWidth] = useState(0);

  return (
    <View style={[styles.hero, { height }]} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <Image
        source={DETAILS_BACKGROUND}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={0}
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
  hero: {
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  content: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 8,
  },
});

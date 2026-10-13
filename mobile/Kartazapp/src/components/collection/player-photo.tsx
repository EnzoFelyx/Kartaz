import { Image, type ImageContentFit } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { colors } from '@/theme/colors';

const SHIMMER_HEIGHT = 40;
const SHIMMER_STEP_MS = 700;
/**
 * Só mostra o brilho se a foto demorar mais que isso: fotos que já estão no cache
 * (pré-carregadas com a página) aparecem direto, sem montar a animação.
 */
const SHIMMER_DELAY_MS = 150;

/**
 * Intensidade da sombra: `card` para as cartas das listas, `hero` para a foto grande dos detalhes,
 * `flat` sem sombra (cartas animadas em 3D / com opacidade, onde o bitmap da sombra pode sumir no iOS).
 */
export type PhotoDepth = 'card' | 'hero' | 'flat';

type PlayerPhotoProps = {
  uri?: string;
  contentFit?: ImageContentFit;
  depth?: PhotoDepth;
};

/**
 * Foto do jogador com o loading do projeto de referência: uma faixa de brilho sobe e desce
 * pela arte enquanto a foto carrega; ao carregar (ou falhar), o brilho some.
 * A foto projeta uma sombra no fundo seguindo o contorno do jogador (efeito de profundidade).
 * Ocupa todo o pai (absoluteFill): o fundo da carta fica por conta de quem usa.
 */
export function PlayerPhoto({ uri, contentFit = 'cover', depth = 'card' }: PlayerPhotoProps) {
  // Fim do carregamento (sucesso ou erro).
  const [settled, setSettled] = useState(!uri);
  const [showShimmer, setShowShimmer] = useState(false);

  useEffect(() => {
    if (settled) return;
    const timeout = setTimeout(() => setShowShimmer(true), SHIMMER_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [settled]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {uri && (
        /*
         * Sombra no contorno do jogador: sem cor de fundo, o iOS calcula a sombra pelos pixels
         * da foto (que é transparente em volta do jogador), não pelo retângulo.
         * Essa sombra é cara de desenhar, então `shouldRasterizeIOS` guarda o resultado como
         * bitmap; o brilho de loading fica fora desta view para não invalidar esse cache.
         * (No Android a sombra não segue o contorno; lá a foto fica sem sombra.)
         */
        <View
          style={[StyleSheet.absoluteFill, depth !== 'flat' && SHADOW[depth]]}
          shouldRasterizeIOS={depth !== 'flat'}>
          <Image
            source={{ uri }}
            style={StyleSheet.absoluteFill}
            contentFit={contentFit}
            // Memória + disco: ao trocar grade/lista a foto volta sem decodificar de novo.
            cachePolicy="memory-disk"
            transition={150}
            onLoad={() => setSettled(true)}
            onError={() => setSettled(true)}
          />
        </View>
      )}
      {showShimmer && <Shimmer active={!settled} />}
    </View>
  );
}

/** Faixa de brilho (gradiente em SVG, mais leve que uma superfície Skia por card). */
function Shimmer({ active }: { active: boolean }) {
  const height = useSharedValue(0);
  const progress = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (!active) {
      cancelAnimation(progress);
      opacity.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.quad) });
      return;
    }
    const easing = Easing.inOut(Easing.quad);
    progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: SHIMMER_STEP_MS, easing }),
        withTiming(0, { duration: SHIMMER_STEP_MS, easing }),
      ),
      -1,
    );
    return () => cancelAnimation(progress);
  }, [active, progress, opacity]);

  // A altura vai para um shared value (não para o state): medir não causa re-render.
  const onLayout = (e: LayoutChangeEvent) => {
    height.value = e.nativeEvent.layout.height;
  };

  const bandStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: -SHIMMER_HEIGHT + progress.value * (height.value + SHIMMER_HEIGHT * 2) },
    ],
  }));

  return (
    <View style={[StyleSheet.absoluteFill, styles.clip]} onLayout={onLayout}>
      <Animated.View style={[styles.band, bandStyle]}>
        <Svg width="100%" height={SHIMMER_HEIGHT}>
          <Defs>
            <LinearGradient id="shimmer" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.white} stopOpacity={0} />
              <Stop offset="0.25" stopColor={colors.white} stopOpacity={0.06} />
              <Stop offset="0.5" stopColor={colors.white} stopOpacity={0.3} />
              <Stop offset="0.75" stopColor={colors.white} stopOpacity={0.06} />
              <Stop offset="1" stopColor={colors.white} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height={SHIMMER_HEIGHT} fill="url(#shimmer)" />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Luz vindo de cima: a sombra cai para baixo, como se o jogador estivesse à frente do fundo.
  cardShadow: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.75,
    shadowRadius: 6,
  },
  heroShadow: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
  },
  clip: {
    overflow: 'hidden',
  },
  band: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: SHIMMER_HEIGHT,
  },
});

const SHADOW = { card: styles.cardShadow, hero: styles.heroShadow };

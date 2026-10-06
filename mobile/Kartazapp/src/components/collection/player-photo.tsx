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

const SHIMMER_HEIGHT = 40;
const SHIMMER_STEP_MS = 700;
/**
 * Só mostra o brilho se a foto demorar mais que isso: fotos que já estão no cache
 * (pré-carregadas com a página) aparecem direto, sem montar a animação.
 */
const SHIMMER_DELAY_MS = 150;

type PlayerPhotoProps = {
  uri?: string;
  contentFit?: ImageContentFit;
};

/**
 * Foto do jogador com o loading do projeto de referência: uma faixa de brilho sobe e desce
 * pela arte enquanto a foto carrega; ao carregar (ou falhar), o brilho some.
 * Ocupa todo o pai (absoluteFill): o fundo da carta fica por conta de quem usa.
 */
export function PlayerPhoto({ uri, contentFit = 'cover' }: PlayerPhotoProps) {
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
              <Stop offset="0" stopColor="#ffffff" stopOpacity={0} />
              <Stop offset="0.25" stopColor="#ffffff" stopOpacity={0.06} />
              <Stop offset="0.5" stopColor="#ffffff" stopOpacity={0.3} />
              <Stop offset="0.75" stopColor="#ffffff" stopOpacity={0.06} />
              <Stop offset="1" stopColor="#ffffff" stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height={SHIMMER_HEIGHT} fill="url(#shimmer)" />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
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

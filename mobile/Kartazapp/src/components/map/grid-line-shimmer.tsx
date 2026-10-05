import { BlurMask, Canvas, Group, LinearGradient, Rect, vec } from '@shopify/react-native-skia';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  cancelAnimation,
  Easing,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { colors, withAlpha } from '@/theme/colors';

/** Comprimento da faixa de luz que corre pela linha (px). */
const BAND_LENGTH = 35;
/** Velocidade do pulso (px por ms): a duração depende do tamanho da linha. */
const PULSE_SPEED = 0.22;

type Orientation = 'vertical' | 'horizontal';

type ShimmerLine = {
  orientation: Orientation;
  /** Posição da linha no eixo perpendicular (x para vertical, y para horizontal). */
  offset: number;
  /** Comprimento da linha (altura ou largura da área). */
  length: number;
  /** Muda a cada pulso para reiniciar a animação mesmo se a linha sorteada repetir. */
  id: number;
};

type GridLineShimmerProps = {
  /** Mesmo tamanho de célula do grid, para o brilho cair exatamente sobre uma linha. */
  cellSize: number;
  strokeWidth?: number;
};

function pickLine(width: number, height: number, cellSize: number, id: number): ShimmerLine {
  const orientation: Orientation = Math.random() < 0.5 ? 'vertical' : 'horizontal';
  const span = orientation === 'vertical' ? width : height;
  // Linhas do grid ficam em múltiplos de cellSize (a primeira, em 0, fica na borda e é ignorada).
  const count = Math.max(1, Math.floor(span / cellSize));
  const index = 1 + Math.floor(Math.random() * count);
  return {
    orientation,
    offset: Math.min(index * cellSize, span - 1),
    length: orientation === 'vertical' ? height : width,
    id,
  };
}

/**
 * Pulso de luz (Skia) que percorre UMA linha aleatória do grid do mapa, vertical ou
 * horizontal, de ponta a ponta e uma única vez. Ao terminar, sorteia outra linha.
 */
export function GridLineShimmer({ cellSize, strokeWidth = 1.5 }: GridLineShimmerProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [line, setLine] = useState<ShimmerLine | null>(null);
  const progress = useSharedValue(0);

  // Roda um pulso na linha atual e agenda a próxima.
  useEffect(() => {
    if (!line) return;
    const travel = line.length + BAND_LENGTH;
    const duration = travel / PULSE_SPEED;

    progress.value = 0;
    progress.value = withTiming(1, { duration, easing: Easing.inOut(Easing.quad) });

    // Assim que o pulso termina, sorteia a próxima linha (sem pausa entre eles).
    const timeout = setTimeout(() => {
      setLine(pickLine(size.width, size.height, cellSize, line.id + 1));
    }, duration);

    return () => {
      clearTimeout(timeout);
      cancelAnimation(progress);
    };
  }, [line, progress, size.width, size.height, cellSize]);

  const isVertical = line?.orientation === 'vertical';
  const lineLength = line?.length ?? 0;

  // A faixa entra por uma ponta (fora da tela) e sai pela outra.
  const transform = useDerivedValue(() => {
    const along = -BAND_LENGTH + progress.value * (lineLength + BAND_LENGTH);
    return isVertical ? [{ translateY: along }] : [{ translateX: along }];
  });

  // Brilho discreto: só ciano translúcido, sem o núcleo branco.
  const bandColors = [
    withAlpha(colors.primary, 0),
    withAlpha(colors.primary, 0.35),
    withAlpha(colors.primary, 0.6),
    withAlpha(colors.primary, 0.35),
    withAlpha(colors.primary, 0),
  ];
  const half = strokeWidth / 2;

  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setSize({ width, height });
        // Sorteia a primeira linha assim que a área tem tamanho (ou ao mudar de tamanho).
        if (width > 0 && height > 0) {
          setLine((current) => pickLine(width, height, cellSize, (current?.id ?? -1) + 1));
        }
      }}>
      {line && (
        <Canvas style={StyleSheet.absoluteFill}>
          <Group transform={transform}>
            {isVertical ? (
              <Rect x={line.offset - half} y={0} width={strokeWidth} height={BAND_LENGTH}>
                <LinearGradient start={vec(0, 0)} end={vec(0, BAND_LENGTH)} colors={bandColors} />
                <BlurMask blur={2} style="solid" />
              </Rect>
            ) : (
              <Rect x={0} y={line.offset - half} width={BAND_LENGTH} height={strokeWidth}>
                <LinearGradient start={vec(0, 0)} end={vec(BAND_LENGTH, 0)} colors={bandColors} />
                <BlurMask blur={2} style="solid" />
              </Rect>
            )}
          </Group>
        </Canvas>
      )}
    </View>
  );
}

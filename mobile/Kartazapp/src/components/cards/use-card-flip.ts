import { useEffect } from 'react';
import {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const FLIP_MS = 680;
const GLOW_IN_MS = 300;

/**
 * Animações da carta para revelar: pulso leve enquanto está virada para baixo, giro 3D ao revelar e o
 * brilho da classe, que só acende depois do giro.
 * @param glowStrength opacidade máxima do brilho (0 = sem brilho, ex.: classe padrão)
 */
export function useCardFlip(revealed: boolean, glowStrength: number) {
  const rotation = useSharedValue(revealed ? 180 : 0);
  const pulse = useSharedValue(1);
  /** Brilho da classe: só acende depois que o giro termina (0 → 1). */
  const glow = useSharedValue(revealed ? 1 : 0);

  useEffect(() => {
    rotation.set(revealed ? withTiming(180, { duration: FLIP_MS, easing: Easing.inOut(Easing.cubic) }) : 0);
    glow.set(revealed ? withDelay(FLIP_MS, withTiming(1, { duration: GLOW_IN_MS })) : 0);
  }, [revealed, rotation, glow]);

  useEffect(() => {
    if (revealed) {
      cancelAnimation(pulse);
      pulse.set(withTiming(1, { duration: 150 }));
      return;
    }
    const easing = Easing.inOut(Easing.quad);
    pulse.set(
      withRepeat(
        withSequence(withTiming(1.025, { duration: 900, easing }), withTiming(1, { duration: 900, easing })),
        -1,
      ),
    );
    return () => cancelAnimation(pulse);
  }, [revealed, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  /*
   * Cada face gira sozinha (0–180 = progresso do giro): as costas vão de 0° a 90° e somem; a frente
   * entra de -90° e termina em 0°, sem rotação.
   * A foto da frente é `flat` (sem a sombra em bitmap das listas): sombra em volta da foto, com
   * opacidade/3D animados, apagava a foto no iOS.
   * As faces ficam num palco só delas e o brilho fica fora, aceso só depois do giro: no iOS a face
   * girada é ordenada em profundidade com as vizinhas, e a metade "de trás" sumia atrás do brilho
   * escuro (metade da carta preta).
   */
  const backStyle = useAnimatedStyle(() => ({
    opacity: rotation.value < 90 ? 1 : 0,
    transform: [{ perspective: 1400 }, { rotateY: `${Math.min(rotation.value, 90)}deg` }],
  }));
  const frontStyle = useAnimatedStyle(() => ({
    opacity: rotation.value < 90 ? 0 : 1,
    transform: [{ perspective: 1400 }, { rotateY: `${Math.max(rotation.value - 180, -90)}deg` }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value > 0 ? 1 : 0,
    shadowOpacity: glowStrength * glow.value,
  }));

  return { pulseStyle, backStyle, frontStyle, glowStyle };
}

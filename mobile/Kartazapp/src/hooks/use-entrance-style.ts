import { useEffect } from 'react';
import { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

/** Duração padrão da entrada (ms). */
export const ENTRANCE_DURATION = 320;

export type EntranceOptions = {
  /** Espera antes de começar (ms): blocos em sequência usam atrasos crescentes. */
  delay: number;
  /** Quantos px o bloco sobe enquanto aparece. */
  offset: number;
  duration?: number;
};

/** Opacidade 0 → 1 subindo `offset` px, após `delay` ms (começa ao montar). */
export function useEntranceStyle({ delay, offset, duration = ENTRANCE_DURATION }: EntranceOptions) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.set(withDelay(delay, withTiming(1, { duration, easing: Easing.out(Easing.cubic) })));
  }, [delay, duration, progress]);

  return useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [{ translateY: (progress.get() - 1) * offset }],
  }));
}

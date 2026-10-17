import { useEffect } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import {
  cancelAnimation,
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import type { Toast } from '@/lib/toast/toast-store';

/** Arraste (px) ou velocidade (px/s) que dispensa o toast para os lados ou para cima. */
const SWIPE_X_DISTANCE = 80;
const SWIPE_UP_DISTANCE = 30;
const SWIPE_VELOCITY = 700;
/** Para baixo o toast não sai: só cede um pouco, como um elástico. */
const DOWN_RESISTANCE = 0.15;
/** Puxar para baixo além disso (dedo, px) fixa o toast: sem tempo limite e sem barra de timer. */
const PIN_DISTANCE = 40;
const FLY_OUT_MS = 180;
const SPRING_BACK = { damping: 18, stiffness: 220 };

/**
 * Timer e gestos do toast: a barra esvazia até o toast sair sozinho; arrastar para cima ou para os
 * lados dispensa (o timer pausa durante o arraste); puxar para baixo fixa o toast (sem tempo limite).
 */
export function useToastSwipe({ id, duration }: Pick<Toast, 'id' | 'duration'>, onDismiss: (id: number) => void) {
  const remaining = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const cardWidth = useSharedValue(0);

  // A barra esvazia no tempo que falta; ao chegar em 0, o toast se fecha.
  const runTimer = () => {
    'worklet';
    remaining.value = withTiming(0, { duration: remaining.value * duration, easing: Easing.linear }, (finished) => {
      if (finished) scheduleOnRN(onDismiss, id);
    });
  };

  useEffect(() => {
    runTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- inicia uma vez por toast
  }, [id]);

  // Eixo travado no início do arraste: o toast anda só na horizontal ou só na vertical, nunca na diagonal.
  const axis = useSharedValue<'none' | 'x' | 'y'>('none');
  // Fixado (puxado para baixo): fica até ser dispensado na mão.
  const pinned = useSharedValue(false);
  const timerOpacity = useSharedValue(1);

  const pan = Gesture.Pan()
    // Só vira arraste depois de mover um pouco: toques no X continuam funcionando.
    .activeOffsetX([-10, 10])
    .activeOffsetY([-10, 10])
    .onStart((event) => {
      cancelAnimation(remaining);
      axis.value = Math.abs(event.translationX) >= Math.abs(event.translationY) ? 'x' : 'y';
    })
    .onUpdate((event) => {
      if (axis.value === 'x') {
        translateX.value = event.translationX;
      } else {
        translateY.value = event.translationY < 0 ? event.translationY : event.translationY * DOWN_RESISTANCE;
      }
    })
    .onEnd((event) => {
      if (axis.value === 'x') {
        if (Math.abs(event.translationX) > SWIPE_X_DISTANCE || Math.abs(event.velocityX) > SWIPE_VELOCITY) {
          const direction = event.translationX + event.velocityX * 0.1 > 0 ? 1 : -1;
          translateX.value = withTiming(direction * cardWidth.value * 1.2, { duration: FLY_OUT_MS }, () =>
            scheduleOnRN(onDismiss, id),
          );
          return;
        }
      } else if (event.translationY < -SWIPE_UP_DISTANCE || event.velocityY < -SWIPE_VELOCITY) {
        translateY.value = withTiming(-200, { duration: FLY_OUT_MS }, () => scheduleOnRN(onDismiss, id));
        return;
      } else if (event.translationY > PIN_DISTANCE || event.velocityY > SWIPE_VELOCITY) {
        pinned.value = true;
        timerOpacity.value = withTiming(0, { duration: 200 });
      }
      // Não passou do limite: volta ao lugar e o timer continua de onde parou (se não estiver fixado).
      translateX.value = withSpring(0, SPRING_BACK);
      translateY.value = withSpring(0, SPRING_BACK);
      if (!pinned.value) runTimer();
    })
    .onFinalize(() => {
      axis.value = 'none';
    });

  const dragStyle = useAnimatedStyle(() => {
    const progress = Math.max(Math.abs(translateX.value) / Math.max(cardWidth.value, 1), -translateY.value / 120);
    return {
      opacity: interpolate(progress, [0, 1], [1, 0], Extrapolation.CLAMP),
      transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
    };
  });

  const timerStyle = useAnimatedStyle(() => ({
    opacity: timerOpacity.value,
    width: `${remaining.value * 100}%`,
  }));

  /** Largura do card (medida no layout): até onde ele voa ao ser dispensado para o lado. */
  const setCardWidth = (width: number) => cardWidth.set(width);

  return { pan, dragStyle, timerStyle, setCardWidth };
}

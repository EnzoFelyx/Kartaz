import { Canvas, LinearGradient, Rect, vec } from '@shopify/react-native-skia';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
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

import { CloseIcon } from '@/components/icons/close-icon';
import { GradientBorder } from '@/components/ui/gradient-border';
import { IconButton } from '@/components/ui/icon-button';
import type { Toast } from '@/lib/toast/toast-store';
import { colors, withAlpha } from '@/theme/colors';

import { TOAST_VARIANTS } from './toast-variants';

const RADIUS = 18;
const BORDER_WIDTH = 1.5;
const ICON_BOX_SIZE = 44;
const ICON_SIZE = 22;
const TIMER_HEIGHT = 3;

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

type ToastCardProps = {
  toast: Toast;
  onDismiss: (id: number) => void;
};

/**
 * Card do toast: selo com ícone, título, mensagem, botão de fechar, borda em gradiente da variante
 * e barra de timer que esvazia até o toast sair sozinho.
 * Arrastar para cima, para a esquerda ou para a direita dispensa o toast; durante o arraste o timer pausa.
 * Puxar para baixo fixa o toast: ele perde o tempo limite e a barra de timer some.
 */
export function ToastCard({ toast, onDismiss }: ToastCardProps) {
  const { t } = useTranslation();
  const variant = TOAST_VARIANTS[toast.variant];
  const [size, setSize] = useState({ width: 0, height: 0 });
  const remaining = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const cardWidth = useSharedValue(0);
  const { id, duration } = toast;

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

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize({ width, height });
    cardWidth.set(width);
  };

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        onLayout={onLayout}
        style={[styles.card, { shadowColor: variant.color }, dragStyle]}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite">
        <GradientBorder colors={variant.gradient} radius={RADIUS} width={BORDER_WIDTH} />

        <View
          style={[
            styles.iconBox,
            { backgroundColor: withAlpha(variant.color, 0.18), borderColor: withAlpha(variant.color, 0.35) },
          ]}>
          {variant.icon(variant.color, ICON_SIZE)}
        </View>

        <View style={styles.texts}>
          <Text style={styles.title} numberOfLines={1}>
            {toast.title}
          </Text>
          {toast.message ? (
            <Text style={styles.message} numberOfLines={2}>
              {toast.message}
            </Text>
          ) : null}
        </View>

        <IconButton
          size={28}
          icon={<CloseIcon color={colors.secondaryForeground} size={14} />}
          accessibilityLabel={t('common.close')}
          onPress={() => onDismiss(toast.id)}
        />

        {/* Timer: esvaida da direita para a esquerda, com o gradiente da variante. */}
        <Animated.View pointerEvents="none" style={[styles.timer, timerStyle]}>
          {size.width > 0 && (
            <Canvas style={{ width: size.width, height: TIMER_HEIGHT }}>
              <Rect x={0} y={0} width={size.width} height={TIMER_HEIGHT}>
                <LinearGradient start={vec(0, 0)} end={vec(size.width, 0)} colors={variant.gradient} />
              </Rect>
            </Canvas>
          )}
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingLeft: 16,
    paddingRight: 12,
    borderRadius: RADIUS,
    overflow: 'hidden',
    backgroundColor: colors.card,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
  },
  iconBox: {
    width: ICON_BOX_SIZE,
    height: ICON_BOX_SIZE,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '800',
  },
  message: {
    color: colors.secondaryForeground,
    fontSize: 13,
    lineHeight: 18,
  },
  timer: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    height: TIMER_HEIGHT,
    overflow: 'hidden',
  },
});

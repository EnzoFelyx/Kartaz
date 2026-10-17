import { Canvas, LinearGradient, Rect, vec } from '@shopify/react-native-skia';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

import { CloseIcon } from '@/components/icons/close-icon';
import { GradientBorder } from '@/components/ui/gradient-border';
import { IconButton } from '@/components/ui/icon-button';
import type { Toast } from '@/lib/toast/toast-store';
import { colors, withAlpha } from '@/theme/colors';

import { TOAST_VARIANTS } from './toast-variants';
import { useToastSwipe } from './use-toast-swipe';

const RADIUS = 18;
const BORDER_WIDTH = 1.5;
const ICON_BOX_SIZE = 44;
const ICON_SIZE = 22;
const TIMER_HEIGHT = 3;

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
  const { pan, dragStyle, timerStyle, setCardWidth } = useToastSwipe(toast, onDismiss);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize({ width, height });
    setCardWidth(width);
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

import { StyleSheet, View } from 'react-native';
import Animated, {
  FadeOutUp,
  LinearTransition,
  withSpring,
  withTiming,
  type EntryAnimationsValues,
  type LayoutAnimation,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { toast, useToasts } from '@/lib/toast/toast-store';

import { ToastCard } from './toast-card';

const ENTER_OFFSET = -40;

/**
 * Entrada: a posição usa mola (o "bounce"), mas a opacidade usa timing. Com `FadeInUp.springify()`
 * a mola também atua na opacidade, que oscila no fim do bounce e faz o toast piscar transparente.
 */
function entering(_values: EntryAnimationsValues): LayoutAnimation {
  'worklet';
  return {
    initialValues: { opacity: 0, transform: [{ translateY: ENTER_OFFSET }] },
    animations: {
      opacity: withTiming(1, { duration: 180 }),
      transform: [{ translateY: withSpring(0, { damping: 18, stiffness: 180 }) }],
    },
  };
}

const EXITING = FadeOutUp.duration(200);
const LAYOUT = LinearTransition.springify().damping(20).stiffness(200);

/**
 * Pilha de toasts no topo da tela. Montar uma vez, por cima de tudo (no layout raiz);
 * os toasts são disparados de qualquer lugar com `toast.success(...)`, `toast.error(...)` etc.
 */
export function ToastHost() {
  const insets = useSafeAreaInsets();
  const items = useToasts();

  return (
    <View pointerEvents="box-none" style={[styles.container, { top: insets.top + 8 }]}>
      {items.map((item) => (
        <Animated.View key={item.id} entering={entering} exiting={EXITING} layout={LAYOUT}>
          <ToastCard toast={item} onDismiss={toast.hide} />
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    gap: 10,
  },
});

import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { colors, withAlpha } from '@/theme/colors';

type ModalCardProps = {
  visible: boolean;
  /** Fechar: toque fora do card, botão voltar do Android e o "Fechar". */
  onClose: () => void;
  children: ReactNode;
  /** Largura máxima do card (padrão 360). */
  maxWidth?: number;
  /** Ajustes do card (ex.: `gap`, ou `padding: 0` quando o conteúdo tem rolagem própria). */
  cardStyle?: StyleProp<ViewStyle>;
  /** Mostra o "Fechar" em texto no fim do card. */
  showClose?: boolean;
  /** Campos de texto no card: sobe o card junto com o teclado. */
  keyboardAvoiding?: boolean;
  /** Gestos do gesture-handler no card (ex.: slider): o Modal fica fora da raiz de gestos do app. */
  gestures?: boolean;
};

/** Modal central do app: fundo escuro (toque fecha) e um card com borda azul. */
export function ModalCard({
  visible,
  onClose,
  children,
  maxWidth = 360,
  cardStyle,
  showClose = false,
  keyboardAvoiding = false,
  gestures = false,
}: ModalCardProps) {
  let body = (
    <Pressable style={styles.backdrop} onPress={onClose}>
      <Pressable
        style={[styles.card, { maxWidth }, cardStyle]}
        onPress={(event) => event.stopPropagation()}
        accessibilityViewIsModal>
        {children}
        {showClose && <ModalCloseButton onPress={onClose} />}
      </Pressable>
    </Pressable>
  );
  if (keyboardAvoiding) {
    body = (
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {body}
      </KeyboardAvoidingView>
    );
  }
  if (gestures) body = <GestureHandlerRootView style={styles.flex}>{body}</GestureHandlerRootView>;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      {body}
    </Modal>
  );
}

/** "Fechar" em texto azul, centralizado (no fim dos modais). */
export function ModalCloseButton({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={8} style={styles.closeButton}>
      <Text style={styles.closeText}>{t('common.close')}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: withAlpha(colors.deep, 0.7),
  },
  card: {
    width: '100%',
    gap: 16,
    padding: 22,
    borderRadius: 22,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: withAlpha(colors.primary, 0.25),
  },
  closeButton: {
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  closeText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
});

import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthButton } from '@/components/auth/auth-button';
import { CARD_REVEAL_ASPECT, CardReveal } from '@/components/cards/card-reveal';
import { ChevronRightIcon } from '@/components/icons/chevron-right-icon';
import { CloseIcon } from '@/components/icons/close-icon';
import { PageDots } from '@/components/onboarding/page-dots';
import { playerForCardId } from '@/lib/cards/mappers';
import type { CardsPack } from '@/lib/colyseus/types';
import { colors, withAlpha } from '@/theme/colors';

const MODAL_MAX_WIDTH = 380;
const MODAL_PADDING = 20;
const SCREEN_GUTTER = 24;
const CARD_MAX_WIDTH = 230;
/** Altura do resto do modal (cabeçalho, pontos, dica, botão e espaçamentos), para a carta caber em telas baixas. */
const MODAL_CHROME_HEIGHT = 320;
/** Espera o fade de entrada do modal antes de vibrar. */
const HAPTIC_DELAY_MS = 250;

const PACK_TITLE = {
  initial: 'cardsPack.titleInitial',
  daily: 'cardsPack.titleDaily',
  found: 'cardsPack.titleFound',
} as const satisfies Record<CardsPack['type'], string>;

type CardsPackModalProps = {
  /** Pack da vez (`null` fecha o modal). */
  pack: CardsPack | null;
  onClose: () => void;
};

/**
 * Abertura de um pack de cartas (boas-vindas com 5, diário com 2): uma carta por vez, o jogador
 * toca para revelar e avança. As cartas já são dele (o servidor criou as cópias), então fechar no
 * meio não perde nada. Tamanho da carta se ajusta à tela e os pontos, à quantidade de cartas.
 */
export function CardsPackModal({ pack, onClose }: CardsPackModalProps) {
  // Mantém o último pack durante o fade de saída do Modal (senão ele some vazio).
  const [shown, setShown] = useState(pack);
  if (pack && pack !== shown) setShown(pack);

  return (
    <Modal visible={pack != null} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        {shown && <PackContent key={shown.cards[0].id} pack={shown} onClose={onClose} />}
      </View>
    </Modal>
  );
}

/** Conteúdo de um pack: o `key` do pai zera índice e carta revelada a cada pack novo. */
function PackContent({ pack, onClose }: { pack: CardsPack; onClose: () => void }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const progress = useSharedValue(0);

  const total = pack.cards.length;
  const card = pack.cards[index];
  const isLast = index >= total - 1;
  const player = useMemo(() => playerForCardId(card.cardId), [card.cardId]);

  const contentWidth = Math.min(screenWidth - SCREEN_GUTTER * 2, MODAL_MAX_WIDTH) - MODAL_PADDING * 2;
  const availableHeight = screenHeight - insets.top - insets.bottom - MODAL_CHROME_HEIGHT;
  const cardWidth = Math.max(160, Math.min(contentWidth, CARD_MAX_WIDTH, availableHeight / CARD_REVEAL_ASPECT));

  // Vibração quando o pack aparece (uma vez por pack: o `key` do pai remonta este conteúdo).
  // "Sucesso" (dois toques curtos) em vez de impacto leve, que mal se sentia junto com a abertura;
  // dispara depois do fade do modal. Respeita o ajuste de vibração do iPhone (ex.: modo silencioso).
  useEffect(() => {
    const timer = setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }, HAPTIC_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    progress.set(withTiming(index, { duration: 250 }));
  }, [index, progress]);

  const next = () => {
    if (!revealed) {
      setRevealed(true);
      return;
    }
    if (isLast) {
      onClose();
      return;
    }
    // Junto com o índice: a carta nova nunca aparece já revelada.
    setRevealed(false);
    setIndex(index + 1);
  };

  const buttonLabel = !revealed ? t('cardsPack.reveal') : isLast ? t('cardsPack.done') : t('cardsPack.nextCard');
  const helper = !revealed ? t('cardsPack.helperTap') : isLast ? t('cardsPack.helperDone') : t('cardsPack.helperNext');

  return (
    <View style={styles.modal} accessibilityViewIsModal>
      <View style={styles.header}>
        <View style={styles.titles}>
          <Text style={styles.title} accessibilityRole="header">
            {t(PACK_TITLE[pack.type])}
          </Text>
          <Text style={styles.subtitle}>{t('cardsPack.progress', { current: index + 1, total })}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('cardsPack.close')}
          hitSlop={8}
          onPress={onClose}
          style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
          <CloseIcon color={colors.secondaryForeground} size={20} />
        </Pressable>
      </View>

      {total > 1 && <PageDots count={total} scrollX={progress} pageWidth={1} />}

      <Animated.View key={card.id} entering={FadeIn.duration(220)} style={styles.cardSlot}>
        <CardReveal
          player={player}
          serialNumber={card.serialNumber}
          serialMax={card.serialMax}
          serialClass={card.serialClass}
          revealed={revealed}
          onReveal={() => setRevealed(true)}
          width={cardWidth}
        />
      </Animated.View>

      <Text style={[styles.helper, !revealed && styles.helperAction]}>{helper}</Text>

      <AuthButton
        label={buttonLabel}
        onPress={next}
        icon={revealed && !isLast ? <ChevronRightIcon color={colors.primaryForeground} size={20} /> : undefined}
        iconPosition="right"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SCREEN_GUTTER,
    backgroundColor: withAlpha(colors.deep, 0.75),
  },
  modal: {
    width: '100%',
    maxWidth: MODAL_MAX_WIDTH,
    gap: 16,
    padding: MODAL_PADDING,
    borderRadius: 24,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: withAlpha(colors.primary, 0.25),
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  titles: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: colors.foreground,
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.secondaryForeground,
    fontSize: 13,
    fontWeight: '600',
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: colors.secondary,
  },
  pressed: {
    opacity: 0.7,
  },
  cardSlot: {
    alignItems: 'center',
  },
  helper: {
    color: colors.secondaryForeground,
    fontSize: 13,
    textAlign: 'center',
  },
  helperAction: {
    color: colors.primarySoft,
  },
});

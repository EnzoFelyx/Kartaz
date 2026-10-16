import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useState } from 'react';

import { playerForCardId } from '@/lib/cards/mappers';
import type { CardsPack } from '@/lib/colyseus/types';

/** Espera o fade de entrada do modal antes de vibrar. */
const HAPTIC_DELAY_MS = 250;

export type CardsPackModalProps = {
  /** Pack da vez (`null` fecha o modal). */
  pack: CardsPack | null;
  onClose: () => void;
};

/**
 * Um pack aberto: carta da vez, revelada ou não, e o avanço (revelar → próxima → concluir). Vibra
 * quando o pack aparece. O `key` do pai remonta tudo a cada pack novo.
 */
export function useCardsPackViewModel({ pack, onClose }: { pack: CardsPack; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const total = pack.cards.length;
  const card = pack.cards[index];
  const isLast = index >= total - 1;
  const player = useMemo(() => playerForCardId(card.cardId), [card.cardId]);

  // Vibração quando o pack aparece (uma vez por pack). "Sucesso" (dois toques curtos) em vez de
  // impacto leve, que mal se sentia junto com a abertura; dispara depois do fade do modal.
  // Respeita o ajuste de vibração do iPhone (ex.: modo silencioso).
  useEffect(() => {
    const timer = setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }, HAPTIC_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

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

  return {
    packType: pack.type,
    index,
    total,
    card,
    player,
    revealed,
    isLast,
    reveal: () => setRevealed(true),
    next,
    onClose,
  };
}

export type CardsPackViewModel = ReturnType<typeof useCardsPackViewModel>;

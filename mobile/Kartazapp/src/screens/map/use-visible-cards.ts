import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef } from 'react';
import type { LatLng } from 'react-native-maps';

import type { CellCard } from '@/lib/colyseus/types';
import { getUserCell } from '@/lib/h3/cells';

/**
 * Cartas da sala (área res 8) que o jogador vê: só as da mesma célula res 9 que ele. Quando uma
 * aparece (entrou na célula dela ou nasceu na sua), vibração leve — uma vez por atualização, por mais
 * cartas que apareçam juntas (a animação do marcador dispara ao montar).
 */
export function useVisibleCards(cards: CellCard[], playerPosition: LatLng | null) {
  const playerCell = playerPosition ? getUserCell(playerPosition.latitude, playerPosition.longitude) : null;
  const visibleCards = useMemo(
    () => (playerCell ? cards.filter((card) => getUserCell(card.lat, card.lng) === playerCell) : []),
    [cards, playerCell],
  );

  const seenIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const ids = new Set(visibleCards.map((card) => card.id));
    const hasNew = visibleCards.some((card) => !seenIdsRef.current.has(card.id));
    seenIdsRef.current = ids;
    if (hasNew) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, [visibleCards]);

  return visibleCards;
}

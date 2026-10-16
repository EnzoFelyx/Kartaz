import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Share } from 'react-native';

import { useOwnedCopy } from '@/hooks/queries/use-my-collection';
import { usePlayer, useSimilarPlayers } from '@/hooks/queries/use-player';
import { getNationName } from '@/utils/card-labels';

/**
 * Detalhes de um jogador: ficha (SQLite), a cópia do usuário (serial e coleta, da API), jogadores
 * parecidos, favorito (local por enquanto) e compartilhar.
 */
export function useCardDetailsViewModel() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  // Favorito local por enquanto (no futuro: intenção enviada ao servidor).
  const [favorite, setFavorite] = useState(false);

  const playerId = Number(id);
  const player = usePlayer(playerId);
  const ownedCopy = useOwnedCopy(playerId);
  const similar = useSimilarPlayers(playerId);

  const card = player.data ?? null;
  const owned = ownedCopy.data ?? null;

  const share = () => {
    if (!card) return;
    Share.share({
      message: t('cardDetails.shareMessage', {
        name: card.name,
        nation: getNationName(card.nation),
        rarity: t(`rarity.${card.rarity}`),
        serial: owned?.serial ?? '—',
        total: owned?.maxSerial ?? card.totalCopies,
      }),
    });
  };

  return {
    card,
    owned,
    loading: player.isPending && Number.isInteger(playerId) && playerId > 0,
    similar: similar.data ?? [],
    favorite,
    toggleFavorite: () => setFavorite((value) => !value),
    share,
    goBack: () => (router.canGoBack() ? router.back() : router.replace('/collection')),
    openSimilar: (similarId: number) => router.push({ pathname: '/card/[id]', params: { id: String(similarId) } }),
    openFoundCopies: () => {
      if (card) router.push({ pathname: '/found-copies/[id]', params: { id: String(card.id) } });
    },
  };
}

export type CardDetailsViewModel = ReturnType<typeof useCardDetailsViewModel>;

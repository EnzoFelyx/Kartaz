import { router, useLocalSearchParams } from 'expo-router';

import { useFoundCopies } from '@/hooks/queries/use-found-copies';
import { usePlayer } from '@/hooks/queries/use-player';
import { useSession } from '@/hooks/queries/use-session';
import type { FoundCopy } from '@/types/player-card';

/**
 * Cópias encontradas de um jogador: resumo do jogador (base local), cópias paginadas (API) e a
 * proposta de troca — só para cópias de outra pessoa.
 */
export function useFoundCopiesViewModel() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const playerId = Number(id);
  const playerQuery = usePlayer(playerId);
  const session = useSession();
  const found = useFoundCopies(playerId);

  const hasError = session.isError || found.isError;
  const isLoading = !hasError && (session.isPending || found.isPending);
  const myUserId = session.data?.userId;

  // Proposta só para cópias de outra pessoa: abre a "Nova troca" com a cópia pedida.
  const makeOffer = (copy: FoundCopy) =>
    router.push({
      pathname: '/trades/new',
      params: {
        instanceId: copy.id,
        cardId: String(copy.cardId),
        counterpartyId: copy.ownerId ?? '',
        counterpartyName: copy.owner,
        serial: String(copy.serial),
        maxSerial: String(copy.maxSerial),
      },
    });

  return {
    player: playerQuery.data ?? null,
    playerLoading: playerQuery.isPending,
    copies: found.copies,
    isLoading,
    hasError,
    retry: () => (session.isError ? session.refetch() : found.refetch()),
    loadingMore: found.isFetchingNextPage,
    loadMore: () => {
      if (found.hasNextPage && !found.isFetchingNextPage) found.fetchNextPage();
    },
    canOffer: (copy: FoundCopy) => !!copy.ownerId && copy.ownerId !== myUserId,
    makeOffer,
    goBack: () => (router.canGoBack() ? router.back() : router.replace('/collection')),
  };
}

export type FoundCopiesViewModel = ReturnType<typeof useFoundCopiesViewModel>;

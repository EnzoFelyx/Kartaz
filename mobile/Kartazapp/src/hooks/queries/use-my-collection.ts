import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { getUserInstances } from '@/lib/api/user-instances-api';
import { userInstanceToPlayerCard } from '@/lib/cards/mappers';
import { queryKeys } from '@/lib/query/keys';
import { prefetchPhotos } from '@/utils/list-loading';

import { useSession } from './use-session';

export const COLLECTION_PAGE_SIZE = 20;

/**
 * Cartas do usuário (`GET /user/instances`), paginadas por limit/offset.
 * A busca (nome do jogador) é feita no servidor.
 */
export function useMyCollection(search: string) {
  const { isReady } = useSession();
  const term = search.trim();

  const result = useInfiniteQuery({
    queryKey: queryKeys.userInstances.list(term),
    // Converte a página uma vez só, ao chegar (inclui leitura no SQLite por card),
    // em vez de refazer a cada render da lista.
    queryFn: async ({ pageParam }) => {
      const page = await getUserInstances({ limit: COLLECTION_PAGE_SIZE, offset: pageParam, search: term || undefined });
      const cards = page.instances.map(userInstanceToPlayerCard);
      prefetchPhotos(cards.map((card) => card.imageUri));
      return { total: page.total, offset: page.offset, cards };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const next = lastPage.offset + lastPage.cards.length;
      return lastPage.cards.length > 0 && next < lastPage.total ? next : undefined;
    },
    enabled: isReady,
    // Ao mudar a busca, mantém a lista anterior até a resposta nova chegar.
    placeholderData: keepPreviousData,
  });

  const cards = useMemo(() => result.data?.pages.flatMap((page) => page.cards) ?? [], [result.data]);
  const total = result.data?.pages[0]?.total ?? 0;

  return { ...result, cards, total };
}

/** Quantas cartas o usuário tem (botão "Minha coleção" da aba Cards). */
export function useCollectionCount() {
  const { isReady } = useSession();
  return useQuery({
    queryKey: queryKeys.userInstances.count,
    queryFn: async () => (await getUserInstances({ limit: 1 })).total,
    enabled: isReady,
  });
}

/** A cópia do usuário deste jogador, se ele tiver (serial, data e local nos detalhes da carta). */
export function useOwnedCopy(cardId: number) {
  const { isReady } = useSession();
  return useQuery({
    queryKey: queryKeys.userInstances.byCard(cardId),
    queryFn: async () => {
      const res = await getUserInstances({ cardId, limit: 1 });
      const instance = res.instances[0];
      return instance ? userInstanceToPlayerCard(instance) : null;
    },
    enabled: isReady && Number.isInteger(cardId) && cardId > 0,
  });
}

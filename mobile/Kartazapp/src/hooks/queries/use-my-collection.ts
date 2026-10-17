import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { getUserInstances } from '@/lib/api/user-instances-api';
import {
  buildCollectionParams,
  DEFAULT_COLLECTION_FILTERS,
  type CollectionFilters,
} from '@/lib/collection/collection-filters';
import { userInstanceToPlayerCard } from '@/lib/cards/mappers';
import { LIST_PAGE_SIZE } from '@/lib/query/config';
import { queryKeys } from '@/lib/query/keys';
import { prefetchPhotos } from '@/utils/list-loading';

import { useSession } from './use-session';

/**
 * Cartas do usuário (`GET /user/instances`), paginadas por limit/offset.
 * A busca (nome do jogador) e os filtros (overall, seleção, posição, origem) são feitos no servidor.
 */
export function useMyCollection(search: string, filters: CollectionFilters = DEFAULT_COLLECTION_FILTERS) {
  const { isReady } = useSession();
  const term = search.trim();

  const result = useInfiniteQuery({
    queryKey: queryKeys.userInstances.list(term, filters),
    // Converte a página uma vez só, ao chegar (inclui leitura no SQLite por card),
    // em vez de refazer a cada render da lista.
    queryFn: async ({ pageParam }) => {
      const page = await getUserInstances({
        ...buildCollectionParams(term, filters),
        limit: LIST_PAGE_SIZE,
        offset: pageParam,
      });
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
    // Ao mudar a busca ou os filtros, mantém a lista anterior até a resposta nova chegar.
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

/** Quantas cartas o usuário achou no mapa (origem `world_pool`), para as conquistas. */
export function useMapFindsCount() {
  const { isReady } = useSession();
  return useQuery({
    queryKey: queryKeys.userInstances.mapFindsCount,
    queryFn: async () => (await getUserInstances({ spawnSource: 'world_pool', limit: 1 })).total,
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

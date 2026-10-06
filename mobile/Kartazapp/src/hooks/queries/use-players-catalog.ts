import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { playerRowToPlayer } from '@/lib/cards/mappers';
import { countPlayers, searchPlayers } from '@/lib/db/playersDb';
import { queryKeys } from '@/lib/query/keys';
import { prefetchPhotos } from '@/utils/list-loading';

/** Tamanho da página do catálogo (igual ao projeto de referência). */
export const PLAYERS_PAGE_SIZE = 20;

type CatalogFilter = {
  query: string;
  /** Quando informado, lista só os jogadores desta seleção. */
  nation?: string;
};

/**
 * Catálogo de jogadores paginado (SQLite local, ordenado por rank).
 * O backend não tem rota de listagem: a base inteira já está no aparelho.
 */
export function usePlayersCatalog({ query, nation }: CatalogFilter) {
  const term = query.trim();
  const result = useInfiniteQuery({
    queryKey: nation ? queryKeys.players.nation(nation, term) : queryKeys.players.search(term),
    queryFn: async ({ pageParam }) => {
      const page = searchPlayers({ query: term, nation, limit: PLAYERS_PAGE_SIZE, offset: pageParam }).map(
        playerRowToPlayer,
      );
      // Fotos da página já vão para o cache enquanto o usuário ainda rola os itens anteriores.
      prefetchPhotos(page.map((player) => player.imageUri));
      return page;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < PLAYERS_PAGE_SIZE ? undefined : allPages.length * PLAYERS_PAGE_SIZE,
    // Ao mudar a busca, mantém a lista anterior na tela até a nova chegar (sem piscar).
    placeholderData: keepPreviousData,
  });

  const players = useMemo(() => result.data?.pages.flat() ?? [], [result.data]);
  return { ...result, players };
}

/** Total de jogadores de uma seleção (subtítulo da tela da seleção). */
export function useNationPlayersCount(nation: string) {
  return useQuery({
    queryKey: queryKeys.players.nationCount(nation),
    queryFn: async () => countPlayers({ nation }),
    enabled: nation.length > 0,
  });
}

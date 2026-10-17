import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { useNationPlayersCount, usePlayersCatalog } from '@/hooks/queries/use-players-catalog';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { LOCAL_SEARCH_DEBOUNCE_MS } from '@/lib/query/config';

/**
 * Jogadores de uma seleção (catálogo completo), com busca e paginação. O parâmetro `code` é o nome
 * da seleção como vem do backend (ex.: "Brazil").
 */
export function useNationViewModel() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const nation = code?.trim() ?? '';
  const [query, setQuery] = useState('');

  const search = useDebouncedValue(query, LOCAL_SEARCH_DEBOUNCE_MS);
  const catalog = usePlayersCatalog({ query: search, nation });
  const total = useNationPlayersCount(nation);

  return {
    nation,
    total: total.data ?? 0,
    players: catalog.players,
    loading: catalog.isPending,
    query,
    setQuery,
    loadingMore: catalog.isFetchingNextPage,
    loadMore: () => {
      if (catalog.hasNextPage && !catalog.isFetchingNextPage) catalog.fetchNextPage();
    },
    goBack: () => (router.canGoBack() ? router.back() : router.replace('/collection')),
    openCard: (id: number) => router.push({ pathname: '/card/[id]', params: { id: String(id) } }),
  };
}

export type NationViewModel = ReturnType<typeof useNationViewModel>;

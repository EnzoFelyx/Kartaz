import { router } from 'expo-router';
import { useState } from 'react';

import { useMyCollection } from '@/hooks/queries/use-my-collection';
import { useSession } from '@/hooks/queries/use-session';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { REMOTE_SEARCH_DEBOUNCE_MS } from '@/lib/query/config';
import {
  DEFAULT_COLLECTION_FILTERS,
  isCollectionFiltersActive,
  type CollectionFilters,
} from '@/lib/collection/collection-filters';

/** Coleção do jogador: busca, filtros, paginação e estados de carregamento/erro. */
export function useMyCollectionViewModel() {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<CollectionFilters>(DEFAULT_COLLECTION_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const search = useDebouncedValue(query, REMOTE_SEARCH_DEBOUNCE_MS);
  const session = useSession();
  const collection = useMyCollection(search, filters);
  const filtersActive = isCollectionFiltersActive(filters);

  // Sem sessão (backend fora do ar) ou falha ao buscar: mostra o erro com "tentar novamente".
  const hasError = session.isError || collection.isError;
  const isLoading = !hasError && (session.isPending || collection.isPending);

  return {
    cards: collection.cards,
    total: collection.total,
    query,
    setQuery,
    filters,
    applyFilters: setFilters,
    filtersActive,
    /** Lista vazia por causa da busca/filtros (e não porque o jogador não tem cartas). */
    filtered: !!search.trim() || filtersActive,
    filtersOpen,
    openFilters: () => setFiltersOpen(true),
    closeFilters: () => setFiltersOpen(false),
    isLoading,
    hasError,
    retry: () => (session.isError ? session.refetch() : collection.refetch()),
    loadingMore: collection.isFetchingNextPage,
    loadMore: () => {
      if (collection.hasNextPage && !collection.isFetchingNextPage) collection.fetchNextPage();
    },
    refreshing: collection.isRefetching && !collection.isFetchingNextPage,
    refresh: () => collection.refetch(),
    goBack: () => (router.canGoBack() ? router.back() : router.replace('/collection')),
    openCard: (id: number) => router.push({ pathname: '/card/[id]', params: { id: String(id) } }),
  };
}

export type MyCollectionViewModel = ReturnType<typeof useMyCollectionViewModel>;

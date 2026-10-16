import { router } from 'expo-router';
import { useDeferredValue, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { ViewMode } from '@/components/collection/view-mode-toggle';
import { useCollectionCount } from '@/hooks/queries/use-my-collection';
import { useNations } from '@/hooks/queries/use-nations';
import { usePlayersCatalog } from '@/hooks/queries/use-players-catalog';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import type { Player } from '@/types/player-card';
import { compareLocale, getNationName } from '@/utils/card-labels';

/** Espera para buscar no SQLite enquanto digita. */
const SEARCH_DEBOUNCE_MS = 250;
export const GRID_COLUMNS = 2;

/**
 * Linha da lista: no modo grade agrupa 2 cartas por linha.
 * Montamos as linhas à mão (em vez de trocar `numColumns`) porque mudar `numColumns`
 * exige remontar o FlatList — o que remontaria o header e cortaria a animação do toggle.
 */
export type CollectionRow =
  { type: 'cards'; key: string; cards: Player[] } | { type: 'nation'; key: string; nation: string; name: string };

function toCardRows(cards: Player[], perRow: number): CollectionRow[] {
  const rows: CollectionRow[] = [];
  for (let i = 0; i < cards.length; i += perRow) {
    const chunk = cards.slice(i, i + perRow);
    rows.push({ type: 'cards', key: chunk.map((card) => card.id).join('-'), cards: chunk });
  }
  return rows;
}

/**
 * Catálogo de cartas: modo de exibição (grade, lista, seleções), busca, linhas da lista e
 * paginação do SQLite, além do total da coleção do usuário.
 */
export function useCollectionViewModel() {
  const { i18n } = useTranslation();
  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // O toggle e o cabeçalho usam `viewMode` (mudam na hora); a lista usa `listMode`, que o React
  // renderiza em segundo plano. A lista antiga continua na tela até a nova ficar pronta,
  // em vez de o app congelar no toque enquanto todas as linhas são remontadas.
  const listMode = useDeferredValue(viewMode);

  const isGrid = listMode === 'grid';
  const isNations = listMode === 'nations';

  // Grade/lista: catálogo paginado do SQLite (20 por página), buscando por nome, time ou seleção.
  const playersQuery = useDebouncedValue(isNations ? '' : query, SEARCH_DEBOUNCE_MS);
  const catalog = usePlayersCatalog({ query: playersQuery });
  const nations = useNations();
  const collectionCount = useCollectionCount();

  // Jogadores (grade/lista) e seleções (globo) são buscas diferentes: ao cruzar entre
  // esses dois grupos, limpa o campo. Entre grade e lista a busca é mantida.
  const changeViewMode = (mode: ViewMode) => {
    if (mode === viewMode) return;
    if ((mode === 'nations') !== (viewMode === 'nations')) setQuery('');
    setViewMode(mode);
  };

  // Seleções da base com o nome no idioma atual, em ordem alfabética desse idioma.
  const sortedNations = useMemo(
    () =>
      (nations.data ?? [])
        .map((nation) => ({ nation, name: getNationName(nation) }))
        .sort((a, b) => compareLocale(a.name, b.name)),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recalcula ao trocar o idioma
    [nations.data, i18n.language],
  );

  // Seleções são filtradas em memória (são poucas); jogadores já vêm filtrados do SQLite.
  const rows = useMemo<CollectionRow[]>(() => {
    if (isNations) {
      const term = query.trim().toLowerCase();
      return sortedNations
        .filter(({ name, nation }) => name.toLowerCase().includes(term) || nation.toLowerCase().includes(term))
        .map(({ nation, name }) => ({ type: 'nation', key: nation, nation, name }));
    }
    return toCardRows(catalog.players, isGrid ? GRID_COLUMNS : 1);
  }, [query, isGrid, isNations, sortedNations, catalog.players]);

  return {
    query,
    setQuery,
    viewMode,
    changeViewMode,
    listMode,
    isGrid,
    isNations,
    rows,
    isLoading: isNations ? nations.isPending : catalog.isPending,
    loadingMore: catalog.isFetchingNextPage && !isNations,
    loadMore: () => {
      if (!isNations && catalog.hasNextPage && !catalog.isFetchingNextPage) catalog.fetchNextPage();
    },
    collectionCount: collectionCount.data ?? 0,
    openCard: (id: number) => router.push({ pathname: '/card/[id]', params: { id: String(id) } }),
    openNation: (code: string) => router.push({ pathname: '/nation/[code]', params: { code } }),
    openMyCollection: () => router.push('/my-collection'),
  };
}

export type CollectionViewModel = ReturnType<typeof useCollectionViewModel>;

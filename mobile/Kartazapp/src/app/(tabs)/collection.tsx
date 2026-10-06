import { router } from 'expo-router';
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GridCard } from '@/components/collection/grid-card';
import { MyCollectionButton } from '@/components/collection/my-collection-button';
import { NationRow } from '@/components/collection/nation-row';
import { PlayerCardRow } from '@/components/collection/player-card-row';
import { ViewModeToggle, type ViewMode } from '@/components/collection/view-mode-toggle';
import { TAB_BAR_BOTTOM_GAP, TAB_BAR_HEIGHT } from '@/components/tab-bar';
import { SearchInput } from '@/components/ui/search-input';
import { useCollectionCount } from '@/hooks/queries/use-my-collection';
import { useNations } from '@/hooks/queries/use-nations';
import { usePlayersCatalog } from '@/hooks/queries/use-players-catalog';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import type { Player } from '@/types/player-card';
import { colors } from '@/theme/colors';
import { compareLocale, getNationName } from '@/utils/card-labels';
import { LIST_END_THRESHOLD, LIST_RENDER_PROPS, listItemEntering } from '@/utils/list-loading';

const GAP = 12;
/** Espera para buscar no SQLite enquanto digita. */
const SEARCH_DEBOUNCE_MS = 250;
const H_PADDING = 20;
const GRID_COLUMNS = 2;

/**
 * Linha da lista: no modo grade agrupa 2 cartas por linha.
 * Montamos as linhas à mão (em vez de trocar `numColumns`) porque mudar `numColumns`
 * exige remontar o FlatList — o que remontaria o header e cortaria a animação do toggle.
 */
type CollectionRow =
  | { type: 'cards'; key: string; cards: Player[] }
  | { type: 'nation'; key: string; nation: string; name: string };

function toCardRows(cards: Player[], perRow: number): CollectionRow[] {
  const rows: CollectionRow[] = [];
  for (let i = 0; i < cards.length; i += perRow) {
    const chunk = cards.slice(i, i + perRow);
    rows.push({ type: 'cards', key: chunk.map((card) => card.id).join('-'), cards: chunk });
  }
  return rows;
}

export default function CollectionScreen() {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // O toggle e o cabeçalho usam `viewMode` (mudam na hora); a lista usa `listMode`, que o React
  // renderiza em segundo plano. A lista antiga continua na tela até a nova ficar pronta,
  // em vez de o app congelar no toque enquanto todas as linhas são remontadas.
  const listMode = useDeferredValue(viewMode);

  const isGrid = listMode === 'grid';
  const isNations = listMode === 'nations';
  const openCard = (id: number) => router.push({ pathname: '/card/[id]', params: { id: String(id) } });

  // Grade/lista: catálogo paginado do SQLite (20 por página), buscando por nome, time ou seleção.
  const playersQuery = useDebouncedValue(isNations ? '' : query, SEARCH_DEBOUNCE_MS);
  const catalog = usePlayersCatalog({ query: playersQuery });
  const nations = useNations();
  const collectionCount = useCollectionCount();

  // Jogadores (grade/lista) e seleções (globo) são buscas diferentes: ao cruzar entre
  // esses dois grupos, limpa o campo. Entre grade e lista a busca é mantida.
  const switchStartedAt = useRef(0);
  const changeViewMode = (mode: ViewMode) => {
    if (mode === viewMode) return;
    if ((mode === 'nations') !== (viewMode === 'nations')) setQuery('');
    switchStartedAt.current = Date.now();
    setViewMode(mode);
  };

  // Medição em desenvolvimento: quanto tempo a lista nova leva para aparecer após o toque.
  useEffect(() => {
    if (__DEV__ && switchStartedAt.current) {
      console.log(`[perf] troca para "${listMode}": ${Date.now() - switchStartedAt.current} ms`);
      switchStartedAt.current = 0;
    }
  }, [listMode]);

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

  const isLoading = isNations ? nations.isPending : catalog.isPending;

  const loadMore = () => {
    if (!isNations && catalog.hasNextPage && !catalog.isFetchingNextPage) catalog.fetchNextPage();
  };

  // Elemento (não função) para o TextInput não perder o foco a cada letra digitada.
  const header = (
    <View style={styles.header}>
      <View style={styles.titles}>
        {/* Toggle na mesma linha do título, centralizado com ele. */}
        <View style={styles.titleRow}>
          <Text style={styles.title} accessibilityRole="header">
            {t('cards.title')}
          </Text>
          <ViewModeToggle value={viewMode} onChange={changeViewMode} />
        </View>
        <Text style={styles.subtitle}>{t('cards.subtitle')}</Text>
      </View>

      {/* Total de cartas do usuário no backend (0 enquanto a sessão não está pronta). */}
      <MyCollectionButton
        count={collectionCount.data ?? 0}
        onPress={() => router.push('/my-collection')}
      />

      <SearchInput
        value={query}
        onChangeText={setQuery}
        placeholder={viewMode === 'nations' ? t('cards.searchTeam') : t('cards.searchPlayers')}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <Animated.FlatList
        data={rows}
        keyExtractor={(row) => `${listMode}-${row.key}`}
        ListHeaderComponent={header}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color={colors.primary} style={styles.loading} />
          ) : (
            <Text style={styles.empty}>{isNations ? t('cards.noTeams') : t('cards.noPlayers')}</Text>
          )
        }
        ListFooterComponent={
          catalog.isFetchingNextPage && !isNations ? (
            <View style={styles.footer}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.footerText}>{t('cards.loadingMore')}</Text>
            </View>
          ) : null
        }
        onEndReached={loadMore}
        onEndReachedThreshold={LIST_END_THRESHOLD}
        {...LIST_RENDER_PROPS}
        renderItem={({ item: row, index }) =>
          row.type === 'nation' ? (
            <Animated.View entering={listItemEntering(index)}>
              <NationRow
                name={row.name}
                onPress={() =>
                  router.push({ pathname: '/nation/[code]', params: { code: row.nation } })
                }
              />
            </Animated.View>
          ) : isGrid ? (
            <View style={styles.gridRow}>
              {row.cards.map((card, column) => (
                <Animated.View
                  key={card.id}
                  style={styles.gridCell}
                  entering={listItemEntering(index * GRID_COLUMNS + column)}
                 >
                  <GridCard card={card} onPress={() => openCard(card.id)} />
                </Animated.View>
              ))}
              {/* Mantém a última carta com meia largura quando a linha fica incompleta. */}
              {row.cards.length < GRID_COLUMNS && <View style={styles.gridCell} />}
            </View>
          ) : (
            <Animated.View entering={listItemEntering(index)}>
              <PlayerCardRow card={row.cards[0]} onPress={() => openCard(row.cards[0].id)} />
            </Animated.View>
          )
        }
        ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + TAB_BAR_BOTTOM_GAP + TAB_BAR_HEIGHT + 24,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: H_PADDING,
  },
  header: {
    gap: 20,
    marginBottom: 16,
  },
  titles: {
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    flex: 1,
    color: colors.foreground,
    fontSize: 34,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.secondaryForeground,
    fontSize: 16,
  },
  gridRow: {
    flexDirection: 'row',
    gap: GAP,
  },
  gridCell: {
    flex: 1,
  },
  empty: {
    marginTop: 24,
    textAlign: 'center',
    color: colors.mutedForeground,
    fontSize: 14,
  },
  loading: {
    marginTop: 32,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  footerText: {
    color: colors.mutedForeground,
    fontSize: 14,
  },
});

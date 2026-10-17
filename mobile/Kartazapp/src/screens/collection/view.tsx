import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GridCard } from '@/components/collection/grid-card';
import { MyCollectionButton } from '@/components/collection/my-collection-button';
import { NationRow } from '@/components/collection/nation-row';
import { PlayerCardRow } from '@/components/collection/player-card-row';
import { ViewModeToggle } from '@/components/collection/view-mode-toggle';
import { TAB_BAR_BOTTOM_GAP, TAB_BAR_HEIGHT } from '@/components/tab-bar';
import { ListLoadingMore, ListState } from '@/components/ui/list-state';
import { SearchInput } from '@/components/ui/search-input';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { getFlagEmojiForCountry } from '@/utils/flags';
import { LIST_END_THRESHOLD, LIST_RENDER_PROPS, listItemEntering } from '@/utils/list-loading';

import { GRID_COLUMNS } from './use-view-model';

import type { CollectionViewModel } from './use-view-model';

const GAP = 12;

/** Título com o toggle de exibição, botão "Minha coleção", busca e a lista (grade, lista ou seleções). */
export function CollectionView({
  query,
  setQuery,
  viewMode,
  changeViewMode,
  listMode,
  isGrid,
  isNations,
  rows,
  isLoading,
  loadingMore,
  loadMore,
  collectionCount,
  openCard,
  openNation,
  openMyCollection,
}: CollectionViewModel) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

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
      <MyCollectionButton count={collectionCount} onPress={openMyCollection} />

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
          <ListState loading={isLoading} emptyText={isNations ? t('cards.noTeams') : t('cards.noPlayers')} />
        }
        ListFooterComponent={loadingMore ? <ListLoadingMore /> : null}
        onEndReached={loadMore}
        onEndReachedThreshold={LIST_END_THRESHOLD}
        {...LIST_RENDER_PROPS}
        renderItem={({ item: row, index }) =>
          row.type === 'nation' ? (
            <Animated.View entering={listItemEntering(index)}>
              <NationRow
                name={row.name}
                flagEmoji={getFlagEmojiForCountry(row.nation)}
                onPress={() => openNation(row.nation)}
              />
            </Animated.View>
          ) : isGrid ? (
            <View style={styles.gridRow}>
              {row.cards.map((card, column) => (
                <Animated.View
                  key={card.id}
                  style={styles.gridCell}
                  entering={listItemEntering(index * GRID_COLUMNS + column)}>
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
    paddingHorizontal: spacing.screen,
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
});

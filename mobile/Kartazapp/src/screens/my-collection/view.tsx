import { useTranslation } from 'react-i18next';
import { Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CollectionFiltersModal } from '@/components/collection/collection-filters-modal';
import { OwnedCardItem } from '@/components/collection/owned-card-item';
import { SlidersIcon } from '@/components/icons/sliders-icon';
import { ListLoadingMore, ListState } from '@/components/ui/list-state';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SearchInput } from '@/components/ui/search-input';
import { colors } from '@/theme/colors';
import { LIST_END_THRESHOLD, LIST_RENDER_PROPS, listItemEntering } from '@/utils/list-loading';

import type { MyCollectionViewModel } from './use-view-model';

const GAP = 14;
const H_PADDING = 20;
const FILTER_BUTTON_SIZE = 52;

/** Coleção do jogador: busca com botão de filtros, lista paginada das cópias e o modal de filtros. */
export function MyCollectionView({
  cards,
  total,
  query,
  setQuery,
  filters,
  applyFilters,
  filtersActive,
  filtered,
  filtersOpen,
  openFilters,
  closeFilters,
  isLoading,
  hasError,
  retry,
  loadingMore,
  loadMore,
  refreshing,
  refresh,
  goBack,
  openCard,
}: MyCollectionViewModel) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={t('myCollection.title')}
        subtitle={t('common.cardsCount', { count: total })}
        onBack={goBack}
      />

      <Animated.FlatList
        data={cards}
        keyExtractor={(card) => card.instanceId}
        ListHeaderComponent={
          <View style={styles.searchRow}>
            <SearchInput
              value={query}
              onChangeText={setQuery}
              placeholder={t('myCollection.search')}
              style={styles.search}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('myCollection.filters.open')}
              accessibilityState={{ selected: filtersActive }}
              onPress={openFilters}
              style={({ pressed }) => [styles.filterButton, pressed && styles.pressed]}>
              <SlidersIcon color={filtersActive ? colors.primary : colors.foreground} size={20} />
              {filtersActive && <View style={styles.filterDot} />}
            </Pressable>
          </View>
        }
        ListEmptyComponent={
          <ListState
            loading={isLoading}
            error={hasError}
            onRetry={retry}
            emptyText={filtered ? t('myCollection.emptyFiltered') : t('myCollection.empty')}
          />
        }
        ListFooterComponent={loadingMore ? <ListLoadingMore /> : null}
        onEndReached={loadMore}
        onEndReachedThreshold={LIST_END_THRESHOLD}
        {...LIST_RENDER_PROPS}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
        renderItem={({ item, index }) => (
          <Animated.View entering={listItemEntering(index)}>
            <OwnedCardItem card={item} onPress={() => openCard(item.id)} />
          </Animated.View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      />

      <CollectionFiltersModal visible={filtersOpen} filters={filters} onApply={applyFilters} onClose={closeFilters} />
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
    paddingTop: 20,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  search: {
    flex: 1,
  },
  filterButton: {
    width: FILTER_BUTTON_SIZE,
    height: FILTER_BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
});

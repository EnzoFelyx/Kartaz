import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PlayerCardRow } from '@/components/collection/player-card-row';
import { ListLoadingMore, ListState } from '@/components/ui/list-state';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SearchInput } from '@/components/ui/search-input';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { getNationName } from '@/utils/card-labels';
import { LIST_END_THRESHOLD, LIST_RENDER_PROPS, listItemEntering } from '@/utils/list-loading';

import type { NationViewModel } from './use-view-model';

const GAP = 12;

/** Cabeçalho com a seleção e o total, busca e a lista paginada dos jogadores. */
export function NationView({
  nation,
  total,
  players,
  loading,
  query,
  setQuery,
  loadingMore,
  loadMore,
  goBack,
  openCard,
}: NationViewModel) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={nation ? getNationName(nation) : t('nation.unknown')}
        subtitle={t('common.playersCount', { count: total })}
        onBack={goBack}
      />

      <Animated.FlatList
        data={players}
        keyExtractor={(player) => String(player.id)}
        ListHeaderComponent={
          <SearchInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('cards.searchPlayers')}
            style={styles.search}
          />
        }
        ListEmptyComponent={<ListState loading={loading} emptyText={t('cards.noPlayers')} />}
        ListFooterComponent={loadingMore ? <ListLoadingMore /> : null}
        onEndReached={loadMore}
        onEndReachedThreshold={LIST_END_THRESHOLD}
        {...LIST_RENDER_PROPS}
        renderItem={({ item, index }) => (
          <Animated.View entering={listItemEntering(index)}>
            <PlayerCardRow card={item} onPress={() => openCard(item.id)} />
          </Animated.View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
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
    paddingTop: 20,
  },
  search: {
    marginBottom: 20,
  },
});

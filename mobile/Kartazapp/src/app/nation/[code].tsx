import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PlayerCardRow } from '@/components/collection/player-card-row';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SearchInput } from '@/components/ui/search-input';
import { ListLoadingMore, ListState } from '@/components/ui/list-state';
import { useNationPlayersCount, usePlayersCatalog } from '@/hooks/queries/use-players-catalog';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { colors } from '@/theme/colors';
import { LIST_END_THRESHOLD, LIST_RENDER_PROPS, listItemEntering } from '@/utils/list-loading';
import { getNationName } from '@/utils/card-labels';

const GAP = 12;
const H_PADDING = 20;
const SEARCH_DEBOUNCE_MS = 250;

/**
 * Todos os jogadores de uma seleção (catálogo completo, não só a coleção), paginados.
 * O parâmetro `code` é o nome da seleção como vem do backend (ex.: "Brazil").
 */
export default function NationScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const nation = code?.trim() ?? '';
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  const search = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const catalog = usePlayersCatalog({ query: search, nation });
  const total = useNationPlayersCount(nation);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/collection'));
  const openCard = (id: number) => router.push({ pathname: '/card/[id]', params: { id: String(id) } });

  const loadMore = () => {
    if (catalog.hasNextPage && !catalog.isFetchingNextPage) catalog.fetchNextPage();
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={nation ? getNationName(nation) : t('nation.unknown')}
        subtitle={t('common.playersCount', { count: total.data ?? 0 })}
        onBack={goBack}
      />

      <Animated.FlatList
        data={catalog.players}
        keyExtractor={(player) => String(player.id)}
        ListHeaderComponent={
          <SearchInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('cards.searchPlayers')}
            style={styles.search}
          />
        }
        ListEmptyComponent={<ListState loading={catalog.isPending} emptyText={t('cards.noPlayers')} />}
        ListFooterComponent={catalog.isFetchingNextPage ? <ListLoadingMore /> : null}
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
    paddingHorizontal: H_PADDING,
    paddingTop: 20,
  },
  search: {
    marginBottom: 20,
  },
});

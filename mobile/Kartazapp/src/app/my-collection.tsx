import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OwnedCardItem } from '@/components/collection/owned-card-item';
import { ArrowLeftIcon } from '@/components/icons/arrow-left-icon';
import { IconButton } from '@/components/ui/icon-button';
import { SearchInput } from '@/components/ui/search-input';
import { useMyCollection } from '@/hooks/queries/use-my-collection';
import { useSession } from '@/hooks/queries/use-session';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { colors } from '@/theme/colors';
import { LIST_END_THRESHOLD, LIST_RENDER_PROPS, listItemEntering } from '@/utils/list-loading';

const GAP = 14;
const H_PADDING = 20;
/** A busca vai para o servidor: espera o usuário parar de digitar. */
const SEARCH_DEBOUNCE_MS = 400;

/** Coleção do jogador: as cópias de carta que ele possui (`GET /user/instances`, paginado). */
export default function MyCollectionScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  const search = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const session = useSession();
  const collection = useMyCollection(search);

  // Sem sessão (backend fora do ar) ou falha ao buscar: mostra o erro com "tentar novamente".
  const hasError = session.isError || collection.isError;
  const isLoading = !hasError && (session.isPending || collection.isPending);

  const retry = () => (session.isError ? session.refetch() : collection.refetch());
  const loadMore = () => {
    if (collection.hasNextPage && !collection.isFetchingNextPage) collection.fetchNextPage();
  };

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/collection'));
  const openCard = (id: number) => router.push({ pathname: '/card/[id]', params: { id: String(id) } });

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <IconButton
          icon={<ArrowLeftIcon color={colors.foreground} />}
          accessibilityLabel={t('common.goBack')}
          onPress={goBack}
        />
        <View style={styles.titles}>
          <Text style={styles.title} accessibilityRole="header">
            {t('myCollection.title')}
          </Text>
          <Text style={styles.subtitle}>{t('common.cardsCount', { count: collection.total })}</Text>
        </View>
      </View>

      <Animated.FlatList
        data={collection.cards}
        keyExtractor={(card) => card.instanceId}
        ListHeaderComponent={
          <SearchInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('myCollection.search')}
            style={styles.search}
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color={colors.primary} style={styles.loading} />
          ) : hasError ? (
            <View style={styles.error}>
              <Text style={styles.empty}>{t('common.loadError')}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={retry}
                style={({ pressed }) => [styles.retryButton, pressed && styles.retryPressed]}>
                <Text style={styles.retryText}>{t('common.retry')}</Text>
              </Pressable>
            </View>
          ) : (
            <Text style={styles.empty}>{t('myCollection.empty')}</Text>
          )
        }
        ListFooterComponent={
          collection.isFetchingNextPage ? (
            <View style={styles.footer}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.footerText}>{t('cards.loadingMore')}</Text>
            </View>
          ) : null
        }
        onEndReached={loadMore}
        onEndReachedThreshold={LIST_END_THRESHOLD}
        {...LIST_RENDER_PROPS}
        refreshControl={
          <RefreshControl
            refreshing={collection.isRefetching && !collection.isFetchingNextPage}
            onRefresh={() => collection.refetch()}
            tintColor={colors.primary}
          />
        }
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: H_PADDING,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titles: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.foreground,
    fontSize: 22,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.secondaryForeground,
    fontSize: 14,
  },
  content: {
    paddingHorizontal: H_PADDING,
    paddingTop: 20,
  },
  search: {
    marginBottom: 20,
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
  error: {
    alignItems: 'center',
    gap: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  retryPressed: {
    transform: [{ scale: 0.97 }],
  },
  retryText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
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

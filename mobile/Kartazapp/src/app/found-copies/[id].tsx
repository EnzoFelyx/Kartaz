import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { STAT_CONFIG } from '@/components/card-details/stat-config';
import { FoundCopyCard } from '@/components/found-copies/found-copy-card';
import { ArrowLeftIcon } from '@/components/icons/arrow-left-icon';
import { useFoundCopies } from '@/hooks/queries/use-found-copies';
import { usePlayer } from '@/hooks/queries/use-player';
import { useSession } from '@/hooks/queries/use-session';
import { colors } from '@/theme/colors';
import { LIST_END_THRESHOLD, LIST_RENDER_PROPS, listItemEntering } from '@/utils/list-loading';

const H_PADDING = 20;
const GAP = 16;
const STAT_ICON_SIZE = 15;

/** Cópias de um jogador já encontradas no jogo, com quem as possui (`GET /players/:id/instances`). */
export default function FoundCopiesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  // Resumo do jogador vem da base local; as cópias, da API (paginadas).
  const playerId = Number(id);
  const playerQuery = usePlayer(playerId);
  const player = playerQuery.data;
  const session = useSession();
  const found = useFoundCopies(playerId);

  const hasError = session.isError || found.isError;
  const isLoading = !hasError && (session.isPending || found.isPending);

  const retry = () => (session.isError ? session.refetch() : found.refetch());
  const loadMore = () => {
    if (found.hasNextPage && !found.isFetchingNextPage) found.fetchNextPage();
  };

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/collection'));

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.goBack')}
          onPress={goBack}
          hitSlop={12}
          style={styles.back}>
          <ArrowLeftIcon color={colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle} accessibilityRole="header">
          {t('foundCopies.title')}
        </Text>
      </View>

      {playerQuery.isPending ? (
        <ActivityIndicator color={colors.primary} style={styles.loading} />
      ) : player ? (
        <Animated.FlatList
          data={found.copies}
          keyExtractor={(copy) => copy.id}
          ListHeaderComponent={
            <View style={styles.summary}>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={1}>
                  {player.name}
                </Text>
                <View style={styles.ratingPill} accessible accessibilityLabel={t('common.ratingA11y', { rating: player.rating })}>
                  <Text style={styles.rating}>{player.rating}</Text>
                </View>
              </View>
              <View style={styles.stats}>
                {STAT_CONFIG.map((stat) => (
                  <View
                    key={stat.key}
                    style={styles.stat}
                    accessible
                    accessibilityLabel={`${t(`stats.${stat.key}`)} ${player.stats[stat.key]}`}>
                    {stat.renderIcon(STAT_ICON_SIZE)}
                    <Text style={styles.statValue}>{player.stats[stat.key]}</Text>
                  </View>
                ))}
              </View>
            </View>
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
              <Text style={styles.empty}>{t('foundCopies.empty')}</Text>
            )
          }
          ListFooterComponent={
            found.isFetchingNextPage ? (
              <View style={styles.footer}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.footerText}>{t('cards.loadingMore')}</Text>
              </View>
            ) : null
          }
          onEndReached={loadMore}
          onEndReachedThreshold={LIST_END_THRESHOLD}
          {...LIST_RENDER_PROPS}
          renderItem={({ item, index }) => (
            <Animated.View entering={listItemEntering(index)} style={styles.item}>
              <FoundCopyCard copy={item} />
            </Animated.View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
          contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <Text style={styles.empty}>{t('foundCopies.notFound')}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: H_PADDING,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  back: {
    position: 'absolute',
    left: H_PADDING,
    bottom: 16,
  },
  headerTitle: {
    color: colors.foreground,
    fontSize: 18,
    fontWeight: '800',
  },
  summary: {
    gap: 16,
    paddingHorizontal: H_PADDING,
    paddingVertical: 20,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  name: {
    flexShrink: 1,
    color: colors.foreground,
    fontSize: 24,
    fontWeight: '800',
  },
  ratingPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  rating: {
    color: colors.foreground,
    fontSize: 20,
    fontWeight: '800',
  },
  // Os 6 atributos numa linha só, distribuídos pela largura.
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    color: colors.foreground,
    fontSize: 15,
    fontWeight: '800',
  },
  item: {
    paddingHorizontal: H_PADDING,
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

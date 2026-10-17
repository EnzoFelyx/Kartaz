import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { STAT_CONFIG } from '@/components/card-details/stat-config';
import { FoundCopyCard } from '@/components/found-copies/found-copy-card';
import { ListLoadingMore, ListState } from '@/components/ui/list-state';
import { ScreenHeader } from '@/components/ui/screen-header';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { LIST_END_THRESHOLD, LIST_RENDER_PROPS, listItemEntering } from '@/utils/list-loading';

import type { FoundCopiesViewModel } from './use-view-model';

const GAP = 16;
const STAT_ICON_SIZE = 15;

/** Resumo do jogador (nome, overall, atributos) e a lista das cópias encontradas, com o botão de proposta. */
export function FoundCopiesView({
  player,
  playerLoading,
  copies,
  isLoading,
  hasError,
  retry,
  loadingMore,
  loadMore,
  canOffer,
  makeOffer,
  goBack,
}: FoundCopiesViewModel) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <ScreenHeader title={t('foundCopies.title')} align="center" onBack={goBack} />

      {playerLoading ? (
        <ActivityIndicator color={colors.primary} style={styles.loading} />
      ) : player ? (
        <Animated.FlatList
          data={copies}
          keyExtractor={(copy) => copy.id}
          ListHeaderComponent={
            <View style={styles.summary}>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={1}>
                  {player.name}
                </Text>
                <View
                  style={styles.ratingPill}
                  accessible
                  accessibilityLabel={t('common.ratingA11y', { rating: player.rating })}>
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
            <ListState loading={isLoading} error={hasError} onRetry={retry} emptyText={t('foundCopies.empty')} />
          }
          ListFooterComponent={loadingMore ? <ListLoadingMore /> : null}
          onEndReached={loadMore}
          onEndReachedThreshold={LIST_END_THRESHOLD}
          {...LIST_RENDER_PROPS}
          renderItem={({ item, index }) => (
            <Animated.View entering={listItemEntering(index)} style={styles.item}>
              <FoundCopyCard copy={item} onMakeOffer={canOffer(item) ? () => makeOffer(item) : undefined} />
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
  summary: {
    gap: 16,
    paddingHorizontal: spacing.screen,
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
    paddingHorizontal: spacing.screen,
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
});

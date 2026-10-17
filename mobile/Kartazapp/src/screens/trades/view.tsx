import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TAB_BAR_BOTTOM_GAP, TAB_BAR_HEIGHT } from '@/components/tab-bar';
import { TradeProposalCard } from '@/components/trades/trade-proposal-card';
import { TradeStatusFilter } from '@/components/trades/trade-status-filter';
import { ListState } from '@/components/ui/list-state';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { listItemEntering } from '@/utils/list-loading';

import type { TradesViewModel } from './use-view-model';

/** Título, abas com os totais e a lista de propostas (cada uma com as suas ações). */
export function TradesView({
  tabs,
  status,
  setStatus,
  counts,
  items,
  loading,
  loadError,
  refreshing,
  refresh,
  myUserId,
  starterIds,
  busyId,
  runAction,
}: TradesViewModel) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title} accessibilityRole="header">
          {t('trades.title')}
        </Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(trade) => trade.id}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + TAB_BAR_BOTTOM_GAP + TAB_BAR_HEIGHT + 24 },
        ]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View style={styles.filter}>
            <TradeStatusFilter statuses={tabs} selected={status} counts={counts} onSelect={setStatus} />
          </View>
        }
        ListEmptyComponent={
          <ListState loading={loading} error={loadError} onRetry={refresh} emptyText={t(`trades.empty.${status}`)} />
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={listItemEntering(index)}>
            <TradeProposalCard
              trade={item}
              myUserId={myUserId}
              starterIds={starterIds}
              busy={busyId === item.id}
              onAction={(kind) => runAction(item.id, kind)}
            />
          </Animated.View>
        )}
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
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: spacing.screen,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    color: colors.foreground,
    fontSize: 32,
    fontWeight: '800',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  filter: {
    marginBottom: 16,
  },
  separator: {
    height: 14,
  },
});

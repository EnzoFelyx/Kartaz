import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TAB_BAR_BOTTOM_GAP, TAB_BAR_HEIGHT } from '@/components/tab-bar';
import { TradeProposalCard } from '@/components/trades/trade-proposal-card';
import { TradeStatusFilter } from '@/components/trades/trade-status-filter';
import { useSession } from '@/hooks/queries/use-session';
import { TRADE_TABS, useTradeAction, useTradeCounts, useTrades, type TradeTab } from '@/hooks/queries/use-trades';
import { useUserTeam } from '@/hooks/queries/use-user-team';
import { colors } from '@/theme/colors';
import { listItemEntering } from '@/utils/list-loading';

/**
 * Trocas: propostas que o jogador enviou e recebeu, nas abas Pendentes (padrão) e Aceitas, cada uma com o total.
 * Quem enviou pode cancelar; quem recebeu, aceitar ou recusar.
 */
export default function TradesScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const session = useSession();
  const [status, setStatus] = useState<TradeTab>('PENDING');
  const trades = useTrades(status);
  const counts = useTradeCounts();
  const team = useUserTeam();
  const action = useTradeAction();

  const starterIds = useMemo(() => new Set((team.data?.slots ?? []).map((slot) => slot.instance.id)), [team.data]);

  // Volta à aba: busca de novo (alguém pode ter aceitado ou proposto nesse meio-tempo).
  const { refetch } = trades;
  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const busyId = action.isPending ? action.variables?.id : undefined;
  const items = trades.data?.items ?? [];

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
        refreshControl={
          <RefreshControl
            refreshing={trades.isRefetching}
            onRefresh={() => void refetch()}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.filter}>
            <TradeStatusFilter statuses={TRADE_TABS} selected={status} counts={counts} onSelect={setStatus} />
          </View>
        }
        ListEmptyComponent={
          trades.isPending || session.isPending ? (
            <ActivityIndicator color={colors.primary} style={styles.loading} />
          ) : trades.isError ? (
            <View style={styles.error}>
              <Text style={styles.empty}>{t('common.loadError')}</Text>
              <Pressable accessibilityRole="button" onPress={() => void refetch()} style={styles.retryButton}>
                <Text style={styles.retryText}>{t('common.retry')}</Text>
              </Pressable>
            </View>
          ) : (
            <Text style={styles.empty}>{t(`trades.empty.${status}`)}</Text>
          )
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={listItemEntering(index)}>
            <TradeProposalCard
              trade={item}
              myUserId={session.data?.userId}
              starterIds={starterIds}
              busy={busyId === item.id}
              onAction={(kind) => action.mutate({ id: item.id, action: kind })}
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
    paddingHorizontal: 20,
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
  loading: {
    marginTop: 32,
  },
  error: {
    alignItems: 'center',
    gap: 16,
    marginTop: 24,
  },
  empty: {
    marginTop: 24,
    color: colors.mutedForeground,
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  retryText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
});

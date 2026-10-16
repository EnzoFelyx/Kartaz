import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthButton } from '@/components/auth/auth-button';
import { NationLabel } from '@/components/collection/nation-label';
import { OvrBadge } from '@/components/collection/ovr-badge';
import { PlayerThumb } from '@/components/collection/player-thumb';
import { OfferCardRow } from '@/components/trades/offer-card-row';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SearchInput } from '@/components/ui/search-input';
import { ListState } from '@/components/ui/list-state';
import { useSession } from '@/hooks/queries/use-session';
import { useUserTeam } from '@/hooks/queries/use-user-team';
import { createTrade, getTradeErrorCode } from '@/lib/api/trades-api';
import { ensureNotificationPermission } from '@/lib/notifications/trade-notifications';
import { fetchAllUserInstances } from '@/lib/api/user-instances-api';
import { playerForCardId } from '@/lib/cards/mappers';
import { queryKeys } from '@/lib/query/keys';
import { toast } from '@/lib/toast/toast-store';
import { colors, withAlpha } from '@/theme/colors';

const TARGET_THUMB_SIZE = 64;

type NewTradeParams = {
  /** Cópia pedida (da outra pessoa). */
  instanceId: string;
  cardId: string;
  counterpartyId: string;
  counterpartyName: string;
  serial: string;
  maxSerial: string;
};

/**
 * Nova troca: a carta que o jogador quer (de outra pessoa) no topo e as cartas dele para oferecer
 * (uma ou mais). Titulares do time aparecem bloqueados. O backend valida tudo de novo ao criar.
 */
export default function NewTradeScreen() {
  const params = useLocalSearchParams<NewTradeParams>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { isReady } = useSession();
  const team = useUserTeam();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const target = useMemo(() => playerForCardId(Number(params.cardId)), [params.cardId]);

  const collection = useQuery({
    queryKey: queryKeys.userInstances.everything,
    queryFn: fetchAllUserInstances,
    enabled: isReady,
  });

  /** Cópias que estão no time: aparecem, mas não podem ser oferecidas. */
  const starterIds = useMemo(() => new Set((team.data?.slots ?? []).map((slot) => slot.instance.id)), [team.data]);

  const myCards = useMemo(() => {
    const term = query.trim().toLowerCase();
    return (collection.data ?? [])
      .filter((instance) => !term || instance.card.name.toLowerCase().includes(term))
      .sort((a, b) => (b.card.ovr ?? 0) - (a.card.ovr ?? 0));
  }, [collection.data, query]);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/collection'));

  const toggle = (id: string) => {
    if (starterIds.has(id)) return;
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const send = useMutation({
    mutationFn: () =>
      createTrade({
        counterpartyId: params.counterpartyId,
        offerInstanceIds: [...selected],
        requestInstanceIds: [params.instanceId],
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.trades.all });
      toast.success(t('trades.sentTitle'), t('trades.sentMessage', { name: params.counterpartyName }));
      // Primeira proposta: pede permissão para avisar quando ela for aceita.
      void ensureNotificationPermission().catch(() => {});
      goBack();
    },
    onError: (error) => {
      const code = getTradeErrorCode(error);
      toast.error(t('trades.errorTitle'), t(`trades.errors.${code ?? 'generic'}`));
      // Titular ou carta que mudou de dono: a lista pode estar velha.
      if (code === 'TRADE_INSTANCE_IN_TEAM' || code === 'TRADE_INSTANCE_NOT_OWNED') {
        void queryClient.invalidateQueries({ queryKey: queryKeys.userTeam });
        void queryClient.invalidateQueries({ queryKey: queryKeys.userInstances.everything });
      }
    },
  });

  const loading = collection.isPending || team.isPending;

  return (
    <View style={styles.container}>
      <ScreenHeader title={t('trades.newTitle')} align="center" onBack={goBack} />

      <FlatList
        data={loading ? [] : myCards}
        keyExtractor={(instance) => instance.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <View style={styles.targetCard}>
              <Text style={styles.targetLabel}>{t('trades.youWant')}</Text>
              <View style={styles.targetRow}>
                <PlayerThumb uri={target.imageUri} size={TARGET_THUMB_SIZE} />
                <View style={styles.targetTexts}>
                  <Text style={styles.targetName} numberOfLines={1}>
                    {target.name}
                  </Text>
                  <Text style={styles.targetSerial} numberOfLines={1}>
                    {t('trades.serialOwner', {
                      serial: params.serial,
                      max: params.maxSerial,
                      owner: params.counterpartyName,
                    })}
                  </Text>
                  <NationLabel nation={target.nation} />
                </View>
                {target.rating > 0 && <OvrBadge ovr={target.rating} variant="solid" style={styles.ovrBadge} />}
              </View>
            </View>

            <SearchInput value={query} onChangeText={setQuery} placeholder={t('trades.searchMine')} />
          </View>
        }
        ListEmptyComponent={
          <ListState
            loading={loading}
            error={collection.isError}
            onRetry={() => void collection.refetch()}
            emptyText={query.trim() ? t('trades.noMatch') : t('trades.noCards')}
          />
        }
        renderItem={({ item }) => (
          <OfferCardRow
            instance={item}
            selected={selected.has(item.id)}
            locked={starterIds.has(item.id)}
            onToggle={() => toggle(item.id)}
          />
        )}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Text style={styles.selectedCount}>{t('trades.selectedCount', { count: selected.size })}</Text>
        <AuthButton
          label={t('trades.send')}
          onPress={() => send.mutate()}
          loading={send.isPending}
          disabled={selected.size === 0 || !params.counterpartyId}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerBlock: {
    gap: 16,
    marginBottom: 16,
  },
  targetCard: {
    gap: 10,
    padding: 16,
    borderRadius: 20,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: withAlpha(colors.primary, 0.3),
  },
  targetLabel: {
    color: colors.secondaryForeground,
    fontSize: 13,
    fontWeight: '700',
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  targetTexts: {
    flex: 1,
    gap: 3,
  },
  targetName: {
    color: colors.foreground,
    fontSize: 18,
    fontWeight: '800',
  },
  targetSerial: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  ovrBadge: {
    alignSelf: 'flex-start',
  },
  separator: {
    height: 12,
  },
  footer: {
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  selectedCount: {
    color: colors.secondaryForeground,
    fontSize: 13,
  },
});

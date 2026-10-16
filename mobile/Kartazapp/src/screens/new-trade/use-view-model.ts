import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useSession } from '@/hooks/queries/use-session';
import { useUserTeam } from '@/hooks/queries/use-user-team';
import { createTrade, getTradeErrorCode } from '@/lib/api/trades-api';
import { fetchAllUserInstances } from '@/lib/api/user-instances-api';
import { playerForCardId } from '@/lib/cards/mappers';
import { ensureNotificationPermission } from '@/lib/notifications/trade-notifications';
import { queryKeys } from '@/lib/query/keys';
import { toast } from '@/lib/toast/toast-store';

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
 * Nova troca: a carta pedida (de outra pessoa) e as cartas do jogador para oferecer (uma ou mais),
 * com busca, seleção múltipla e titulares bloqueados. O backend valida tudo de novo ao criar.
 */
export function useNewTradeViewModel() {
  const params = useLocalSearchParams<NewTradeParams>();
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

  return {
    target,
    serial: params.serial,
    maxSerial: params.maxSerial,
    counterpartyName: params.counterpartyName,
    query,
    setQuery,
    myCards: loading ? [] : myCards,
    loading,
    loadError: collection.isError,
    retry: () => void collection.refetch(),
    isSelected: (id: string) => selected.has(id),
    isLocked: (id: string) => starterIds.has(id),
    toggle,
    selectedCount: selected.size,
    canSend: selected.size > 0 && !!params.counterpartyId,
    sending: send.isPending,
    send: () => send.mutate(),
    goBack,
  };
}

export type NewTradeViewModel = ReturnType<typeof useNewTradeViewModel>;

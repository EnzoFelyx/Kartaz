import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import { useSession } from '@/hooks/queries/use-session';
import {
  TRADE_TABS,
  useTradeAction,
  useTradeCounts,
  useTrades,
  type TradeAction,
  type TradeTab,
} from '@/hooks/queries/use-trades';
import { useUserTeam } from '@/hooks/queries/use-user-team';

/**
 * Trocas: aba selecionada (Pendentes / Aceitas), propostas e totais, titulares do time (para bloquear
 * o aceite) e as ações de aceitar, recusar e cancelar. Busca de novo ao voltar para a aba.
 */
export function useTradesViewModel() {
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

  return {
    tabs: TRADE_TABS,
    status,
    setStatus,
    counts,
    items: trades.data?.items ?? [],
    loading: trades.isPending || session.isPending,
    loadError: trades.isError,
    refreshing: trades.isRefetching,
    refresh: () => void refetch(),
    myUserId: session.data?.userId,
    starterIds,
    busyId: action.isPending ? action.variables?.id : undefined,
    runAction: (id: string, kind: TradeAction) => action.mutate({ id, action: kind }),
  };
}

export type TradesViewModel = ReturnType<typeof useTradesViewModel>;

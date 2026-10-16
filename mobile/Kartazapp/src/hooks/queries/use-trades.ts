import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import {
  acceptTrade,
  cancelTrade,
  declineTrade,
  getTradeErrorCode,
  getTrades,
  type TradeStatus,
} from '@/lib/api/trades-api';
import { queryKeys } from '@/lib/query/keys';
import { toast } from '@/lib/toast/toast-store';

import { useSession } from './use-session';

/** Abas da tela de Trocas (recusadas e canceladas não são listadas). */
export type TradeTab = Extract<TradeStatus, 'PENDING' | 'ACCEPTED'>;
export const TRADE_TABS: TradeTab[] = ['PENDING', 'ACCEPTED'];

/** Propostas de um status (enviadas e recebidas), mais recentes primeiro. */
export function useTrades(status: TradeTab) {
  const { isReady } = useSession();
  return useQuery({
    queryKey: queryKeys.trades.list(status),
    queryFn: () => getTrades({ status, take: 100 }),
    enabled: isReady,
  });
}

/** Total de propostas em cada aba (o número ao lado do nome). Só lê o `total`. */
export function useTradeCounts() {
  const { isReady } = useSession();
  const results = useQueries({
    queries: TRADE_TABS.map((status) => ({
      queryKey: queryKeys.trades.count(status),
      queryFn: async () => (await getTrades({ status, take: 1 })).total,
      enabled: isReady,
    })),
  });
  return Object.fromEntries(TRADE_TABS.map((status, index) => [status, results[index].data])) as Partial<
    Record<TradeTab, number>
  >;
}

export type TradeAction = 'accept' | 'decline' | 'cancel';

const ACTIONS = { accept: acceptTrade, decline: declineTrade, cancel: cancelTrade };

/**
 * Aceitar / recusar / cancelar uma proposta. Depois atualiza as trocas e, no aceite, a coleção e o
 * time (as cartas trocaram de dono).
 */
export function useTradeAction() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: TradeAction }) => ACTIONS[action](id),
    onSuccess: (_trade, { action }) => {
      toast.success(t(`trades.actions.${action}Done`));
      if (action === 'accept') {
        void queryClient.invalidateQueries({ queryKey: queryKeys.userInstances.all });
        void queryClient.invalidateQueries({ queryKey: queryKeys.userTeam });
        void queryClient.invalidateQueries({ queryKey: queryKeys.players.all });
      }
    },
    onError: (error) => {
      const code = getTradeErrorCode(error);
      toast.error(t('trades.actionErrorTitle'), t(`trades.errors.${code ?? 'generic'}`));
    },
    // Sucesso ou erro (ex.: a proposta já tinha sido cancelada): a lista volta a refletir o servidor.
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.trades.all }),
  });
}

import type { TradeAction } from '@/hooks/queries/use-trades';
import type { TradeProposalDto } from '@/lib/api/trades-api';

export type TradeProposalCardProps = {
  trade: TradeProposalDto;
  myUserId: string | undefined;
  /** Cópias titulares do meu time: com uma delas no meu lado, não dá para aceitar. */
  starterIds: Set<string>;
  /** Ação em andamento nesta proposta (desabilita os botões). */
  busy: boolean;
  onAction: (action: TradeAction) => void;
};

/**
 * A proposta do meu ponto de vista: se fui eu quem enviou, com quem é, o que sai das minhas mãos e o
 * que eu ganho, e se o aceite está bloqueado (carta pedida de mim é titular do time).
 */
export function useTradeProposalCardViewModel({ trade, myUserId, starterIds, busy, onAction }: TradeProposalCardProps) {
  const sentByMe = trade.initiator.id === myUserId;
  const other = sentByMe ? trade.counterparty : trade.initiator;
  const iGive = sentByMe ? trade.offerFromInitiator : trade.offerFromCounterparty;
  const iGet = sentByMe ? trade.offerFromCounterparty : trade.offerFromInitiator;

  return {
    status: trade.status,
    createdAt: trade.createdAt,
    sentByMe,
    otherName: other.username ?? '—',
    iGive,
    iGet,
    pending: trade.status === 'PENDING',
    acceptBlocked: !sentByMe && iGive.some((instance) => starterIds.has(instance.id)),
    busy,
    onAction,
  };
}

export type TradeProposalCardViewModel = ReturnType<typeof useTradeProposalCardViewModel>;

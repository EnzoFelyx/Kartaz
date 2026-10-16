import { useTradeProposalCardViewModel, type TradeProposalCardProps } from './use-view-model';
import { TradeProposalCardView } from './view';

/**
 * Uma proposta de troca, do ponto de vista do jogador: o que ele oferece e recebe, com quem, o status
 * e as ações (cancelar a enviada; aceitar ou recusar a recebida).
 */
export function TradeProposalCard(props: TradeProposalCardProps) {
  const viewModel = useTradeProposalCardViewModel(props);
  return <TradeProposalCardView {...viewModel} />;
}

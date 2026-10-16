import { useTradesViewModel } from './use-view-model';
import { TradesView } from './view';

/**
 * Trocas: propostas que o jogador enviou e recebeu, nas abas Pendentes (padrão) e Aceitas, cada uma
 * com o total. Quem enviou pode cancelar; quem recebeu, aceitar ou recusar.
 */
export default function TradesScreen() {
  const viewModel = useTradesViewModel();
  return <TradesView {...viewModel} />;
}

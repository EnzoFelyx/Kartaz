import { useNewTradeViewModel } from './use-view-model';
import { NewTradeView } from './view';

/**
 * Nova troca: a carta que o jogador quer (de outra pessoa) no topo e as cartas dele para oferecer
 * (uma ou mais). Titulares do time aparecem bloqueados.
 */
export default function NewTradeScreen() {
  const viewModel = useNewTradeViewModel();
  return <NewTradeView {...viewModel} />;
}

import { useRefuelModalViewModel, type RefuelModalProps } from './use-view-model';
import { RefuelModalView } from './view';

/**
 * "Abastecer": mostra a energia atual e o botão de encher o tanque com moedas, por um preço fixo
 * (o mesmo da sala, não importa quanto falta); quem cobra é o servidor.
 */
export function RefuelModal(props: RefuelModalProps) {
  const viewModel = useRefuelModalViewModel(props);
  return <RefuelModalView {...viewModel} />;
}

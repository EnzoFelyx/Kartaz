import { useCardDetailsViewModel } from './use-view-model';
import { CardDetailsView } from './view';

/** Detalhes de uma carta (jogador): atributos, a cópia do usuário e jogadores parecidos. */
export default function CardDetailsScreen() {
  const viewModel = useCardDetailsViewModel();
  return <CardDetailsView {...viewModel} />;
}

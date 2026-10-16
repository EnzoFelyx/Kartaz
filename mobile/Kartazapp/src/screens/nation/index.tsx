import { useNationViewModel } from './use-view-model';
import { NationView } from './view';

/** Todos os jogadores de uma seleção (catálogo completo, não só a coleção), paginados. */
export default function NationScreen() {
  const viewModel = useNationViewModel();
  return <NationView {...viewModel} />;
}

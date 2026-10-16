import { useFoundCopiesViewModel } from './use-view-model';
import { FoundCopiesView } from './view';

/** Cópias de um jogador já encontradas no jogo, com quem as possui (`GET /players/:id/instances`). */
export default function FoundCopiesScreen() {
  const viewModel = useFoundCopiesViewModel();
  return <FoundCopiesView {...viewModel} />;
}

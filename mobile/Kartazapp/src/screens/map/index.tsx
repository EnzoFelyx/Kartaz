import { useMapViewModel } from './use-view-model';
import { MapScreenView } from './view';

/** Mapa do jogo: Explore Mode, sala da célula H3 em tempo real, HUD, painel, radar e packs. */
export default function MapScreen() {
  const viewModel = useMapViewModel();
  return <MapScreenView {...viewModel} />;
}

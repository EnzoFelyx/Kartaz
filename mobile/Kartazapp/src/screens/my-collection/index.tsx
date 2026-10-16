import { useMyCollectionViewModel } from './use-view-model';
import { MyCollectionView } from './view';

/** Coleção do jogador: as cópias de carta que ele possui (`GET /user/instances`, paginado). */
export default function MyCollectionScreen() {
  const viewModel = useMyCollectionViewModel();
  return <MyCollectionView {...viewModel} />;
}

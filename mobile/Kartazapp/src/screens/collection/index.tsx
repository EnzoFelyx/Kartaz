import { useCollectionViewModel } from './use-view-model';
import { CollectionView } from './view';

/** Catálogo de cartas: todos os jogadores (grade ou lista) ou as seleções. */
export default function CollectionScreen() {
  const viewModel = useCollectionViewModel();
  return <CollectionView {...viewModel} />;
}

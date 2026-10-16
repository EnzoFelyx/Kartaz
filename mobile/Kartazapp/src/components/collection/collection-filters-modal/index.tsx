import { useCollectionFiltersViewModel, type CollectionFiltersModalProps } from './use-view-model';
import { CollectionFiltersFrame, CollectionFiltersView } from './view';

/**
 * Filtros da coleção: faixa de overall (slider com dois thumbs), seleção, posição e origem da cópia.
 * Edita um rascunho; só "Aplicar" muda a lista. "Limpar" volta o rascunho ao padrão.
 */
export function CollectionFiltersModal({ visible, filters, onApply, onClose }: CollectionFiltersModalProps) {
  return (
    <CollectionFiltersFrame visible={visible} onClose={onClose}>
      {/* Remonta a cada abertura: o rascunho começa nos filtros aplicados. */}
      {visible && <FiltersContent filters={filters} onApply={onApply} onClose={onClose} />}
    </CollectionFiltersFrame>
  );
}

function FiltersContent(props: Omit<CollectionFiltersModalProps, 'visible'>) {
  const viewModel = useCollectionFiltersViewModel(props);
  return <CollectionFiltersView {...viewModel} />;
}

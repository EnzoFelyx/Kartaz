import { useState } from 'react';

import {
  DEFAULT_COLLECTION_FILTERS,
  OVR_MAX,
  OVR_MIN,
  type CollectionFilters,
} from '@/lib/collection/collection-filters';

export type CollectionFiltersModalProps = {
  visible: boolean;
  /** Filtros aplicados na lista (o modal começa com eles). */
  filters: CollectionFilters;
  onApply: (filters: CollectionFilters) => void;
  onClose: () => void;
};

/**
 * Rascunho dos filtros (só "Aplicar" muda a lista; "Limpar" volta ao padrão) e a faixa de overall
 * mostrada no texto, que acompanha o arraste ao vivo (o rascunho só muda ao soltar o slider).
 */
export function useCollectionFiltersViewModel({
  filters,
  onApply,
  onClose,
}: Omit<CollectionFiltersModalProps, 'visible'>) {
  const [draft, setDraft] = useState(filters);
  const [liveRange, setLiveRange] = useState({ low: filters.ovrMin, high: filters.ovrMax });

  const update = (patch: Partial<CollectionFilters>) => setDraft((current) => ({ ...current, ...patch }));

  return {
    draft,
    liveRange,
    slideRange: (low: number, high: number) => setLiveRange({ low, high }),
    changeRange: (low: number, high: number) => {
      setLiveRange({ low, high });
      update({ ovrMin: low, ovrMax: high });
    },
    setNation: (nation: string) => update({ nation }),
    setPosition: (position: string) => update({ position }),
    setSpawnSource: (spawnSource: string) => update({ spawnSource }),
    clear: () => {
      setDraft(DEFAULT_COLLECTION_FILTERS);
      setLiveRange({ low: OVR_MIN, high: OVR_MAX });
    },
    apply: () => {
      onApply(draft);
      onClose();
    },
    onClose,
  };
}

export type CollectionFiltersViewModel = ReturnType<typeof useCollectionFiltersViewModel>;

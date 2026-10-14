import type { GetUserInstancesParams } from '@/lib/api/user-instances-api';
import { toBackendNationFilter } from '@/utils/card-labels';

export const OVR_MIN = 0;
export const OVR_MAX = 100;

/** Filtros da tela "Minha Coleção" (modal de filtros). */
export type CollectionFilters = {
  ovrMin: number;
  ovrMax: number;
  /** Seleções separadas por vírgula, em qualquer idioma ou código (ex.: "BRA, Argentina"). */
  nation: string;
  /** Posições separadas por vírgula (ex.: "ST, CM"). */
  position: string;
  /** Origem da cópia separada por vírgula (ex.: "user_pack, world_pool"). */
  spawnSource: string;
};

export const DEFAULT_COLLECTION_FILTERS: CollectionFilters = {
  ovrMin: OVR_MIN,
  ovrMax: OVR_MAX,
  nation: '',
  position: '',
  spawnSource: '',
};

/** Algum filtro diferente do padrão (mostra o ponto no botão de filtros). */
export function isCollectionFiltersActive(filters: CollectionFilters) {
  return (
    filters.ovrMin !== OVR_MIN ||
    filters.ovrMax !== OVR_MAX ||
    filters.nation.trim() !== '' ||
    filters.position.trim() !== '' ||
    filters.spawnSource.trim() !== ''
  );
}

/** Lista "a, b ,c" → "a,b,c" (vazio → undefined, para não ir na query). */
function csv(value: string) {
  const items = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length > 0 ? items.join(',') : undefined;
}

/**
 * Busca + filtros → query do `GET /user/instances`. A faixa de overall só vai quando não é a
 * completa (0–100); a seleção é traduzida para o nome em inglês que o backend guarda.
 */
export function buildCollectionParams(search: string, filters: CollectionFilters): GetUserInstancesParams {
  const term = search.trim();
  const nation = toBackendNationFilter(filters.nation);
  return {
    search: term || undefined,
    ovrMin: filters.ovrMin !== OVR_MIN ? filters.ovrMin : undefined,
    ovrMax: filters.ovrMax !== OVR_MAX ? filters.ovrMax : undefined,
    nation: nation || undefined,
    position: csv(filters.position),
    spawnSource: csv(filters.spawnSource),
  };
}

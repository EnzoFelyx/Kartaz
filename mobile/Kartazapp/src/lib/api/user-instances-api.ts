import { apiJson, toQueryString } from './client';

/** Jogador resumido que acompanha cada cópia (`card` no JSON do backend). */
export type InstanceCardDto = {
  id: number;
  name: string;
  ovr: number | null;
  url: string | null;
  maxSupply: number;
  nation: string | null;
  team: string | null;
};

export type InstanceFoundWhereDto = {
  city: string | null;
  state: string | null;
  lat: number | null;
  lng: number | null;
};

/** Cópia de uma carta (`Instance` no Prisma), como devolvida por `GET /user/instances`. */
export type UserInstanceDto = {
  id: string;
  cardId: number;
  serialNumber: number;
  serialMax: number;
  serialLabel: string;
  serialClass: 'standard' | 'elite' | 'extreme';
  spawnSource: string;
  spawnedAt: string;
  updatedAt: string;
  foundWhen: string | null;
  foundWhere: InstanceFoundWhereDto;
  spawnLocation: { lat: number | null; lng: number | null; h3RoomCell: string | null };
  card: InstanceCardDto;
};

/** Resposta paginada (limit/offset). O backend limita `limit` a 100. */
export type PaginatedInstances<T> = {
  total: number;
  limit: number;
  offset: number;
  instances: T[];
};

export type GetUserInstancesParams = {
  limit?: number;
  offset?: number;
  /** Busca pelo nome do jogador. */
  search?: string;
  cardId?: number;
  /** Uma ou mais seleções separadas por vírgula. */
  nation?: string;
  ovrMin?: number;
  ovrMax?: number;
  position?: string;
};

/** GET /user/instances — cartas do usuário logado, ordenadas por overall (maior primeiro). */
export function getUserInstances(params: GetUserInstancesParams = {}) {
  return apiJson<PaginatedInstances<UserInstanceDto>>(`/user/instances${toQueryString(params)}`, {
    auth: 'user',
  });
}

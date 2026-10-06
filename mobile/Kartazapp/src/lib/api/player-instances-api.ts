import { ApiError, apiJson, toQueryString } from './client';
import type { PaginatedInstances, UserInstanceDto } from './user-instances-api';

export type InstanceOwnerDto = {
  id: string;
  username: string;
  avatarId: number | null;
};

/** Cópia encontrada de um jogador, com o dono. */
export type PlayerInstanceDto = UserInstanceDto & {
  owner: InstanceOwnerDto | null;
};

export type PlayerInstancesResponse = PaginatedInstances<PlayerInstanceDto> & {
  playerId: number;
};

/**
 * GET /players/:id/instances — cópias já encontradas deste jogador, por serial (menor primeiro).
 * O backend responde 404 se o jogador não existir no Postgres (ex.: base do servidor ainda não importada):
 * para o app isso é o mesmo que "nenhuma cópia encontrada".
 */
export async function getPlayerInstances(
  playerId: number,
  params: { limit?: number; offset?: number } = {},
): Promise<PlayerInstancesResponse> {
  try {
    return await apiJson<PlayerInstancesResponse>(`/players/${playerId}/instances${toQueryString(params)}`, {
      auth: 'user',
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return { playerId, total: 0, limit: params.limit ?? 0, offset: params.offset ?? 0, instances: [] };
    }
    throw error;
  }
}

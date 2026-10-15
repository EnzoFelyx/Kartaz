import { ApiError, apiJson } from './client';
import type { UserInstanceDto } from './user-instances-api';

/** Bônus de uma seleção no time (2+ jogadores da mesma seleção somam bônus cumulativo). */
export type NationalitySynergyDto = {
  nation: string;
  count: number;
  bonusPercent: number;
};

/** Time do usuário (`GET /user/team`): criado com as 5 cartas do pacote de boas-vindas. */
export type UserTeamDto = {
  id: string;
  name: string;
  overall: number;
  baseOverallSum: number;
  nationalityBonusPercent: number;
  maxSameNationCount: number;
  nationalitySynergy: NationalitySynergyDto[];
  shieldId: number | null;
  shieldUrl: string | null;
  globalRank: number | null;
  wins: number;
  losses: number;
  slots: { slotIndex: number; instance: UserInstanceDto }[];
};

/** GET /user/team — `null` se o usuário ainda não tem time (sem o pacote de boas-vindas). */
export async function getUserTeam(): Promise<UserTeamDto | null> {
  try {
    return await apiJson<UserTeamDto>('/user/team', { auth: 'user' });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export type PatchUserTeamBody = {
  name?: string;
  /** Exatamente 5 cópias do usuário, de jogadores diferentes. */
  instanceIds?: string[];
};

/** PATCH /user/team — renomeia e/ou troca os titulares. */
export function patchUserTeam(body: PatchUserTeamBody) {
  return apiJson<unknown>('/user/team', {
    method: 'PATCH',
    auth: 'user',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

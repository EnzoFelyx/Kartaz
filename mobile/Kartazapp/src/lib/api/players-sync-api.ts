import { apiFetch, apiJson, toQueryString } from './client';

export type PlayersVersionResponse = {
  version: number;
  updatedAt: string | null;
  /** Só vem quando o servidor tem uma versão maior que `localVersion`. */
  downloadUrl?: string;
};

export type PlayerProgressDto = {
  id: number;
  progress_version: string;
  max_supply: number;
  found_count: number;
};

/** GET /players/version — versão atual da base de jogadores no servidor. */
export function getPlayersVersion(localVersion: number) {
  return apiJson<PlayersVersionResponse>(`/players/version${toQueryString({ localVersion })}`, {
    auth: 'admin',
  });
}

/** GET /players/versions/:v/download — base inteira em NDJSON compactado (gzip). */
export async function downloadPlayersVersionFile(version: number): Promise<ArrayBuffer> {
  const res = await apiFetch(`/players/versions/${version}/download`, { auth: 'admin' });
  return res.arrayBuffer();
}

/**
 * GET /admin/players/progress — `found_count`/`max_supply` dos jogadores que já tiveram cópias encontradas.
 * Sempre a partir da versão 0: o `progress_version` é por jogador, então usar o maior como cursor perderia updates.
 */
export function getPlayersProgress() {
  return apiJson<PlayerProgressDto[]>('/admin/players/progress?version=0', { auth: 'admin' });
}

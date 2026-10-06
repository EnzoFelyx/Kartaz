import { apiFetch, apiJson, toQueryString } from './client';

export type PlayersVersionResponse = {
  version: number;
  updatedAt: string | null;
  /** Só vem quando o servidor tem uma versão maior que `localVersion`. */
  downloadUrl?: string;
};

export type PlayerProgressDto = {
  id: number;
  max_supply: number;
  found_count: number;
};

export type PlayersProgressResponse = {
  /** Cursor (BIGINT como string): maior `progress_version` retornado, ou o próprio `sinceVersion`. */
  version: string;
  items: PlayerProgressDto[];
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
 * GET /players/progress — delta de `found_count`/`max_supply`: só as cartas que mudaram
 * depois de `sinceVersion` (versão global, vinda de uma SEQUENCE no Postgres).
 */
export function getPlayersProgress(sinceVersion: number) {
  return apiJson<PlayersProgressResponse>(`/players/progress${toQueryString({ sinceVersion })}`, {
    auth: 'admin',
  });
}

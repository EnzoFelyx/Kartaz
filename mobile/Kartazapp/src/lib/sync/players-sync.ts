import { inflate } from 'pako';

import {
  downloadPlayersVersionFile,
  getPlayersProgress,
  getPlayersVersion,
} from '@/lib/api/players-sync-api';
import {
  applyPlayersProgressUpdates,
  getLocalPlayersVersion,
  initPlayersDb,
  setLocalPlayersVersion,
  upsertPlayers,
} from '@/lib/db/playersDb';
import type { PlayerRow } from '@/types/player';

const BATCH_SIZE = 500;

export type PlayersSyncResult = {
  /** Versão local da base depois do sync. */
  version: number;
  /** Jogadores gravados a partir de uma versão nova do servidor (0 se já estava em dia). */
  imported: number;
  /** Jogadores com found/total atualizados. */
  progressUpdated: number;
};

/**
 * Linha do NDJSON do servidor: camelCase, exceto `max_supply`/`found_count`,
 * que vêm com o nome da coluna (o seed embutido já vem em camelCase).
 */
type ServerPlayerRow = PlayerRow & { max_supply?: number | null; found_count?: number | null };

function parsePlayersFile(buffer: ArrayBuffer): PlayerRow[] {
  const text = new TextDecoder('utf-8').decode(inflate(new Uint8Array(buffer)));
  const rows: PlayerRow[] = [];
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    try {
      const row = JSON.parse(line) as ServerPlayerRow;
      if (typeof row?.id !== 'number') continue;
      rows.push({
        ...row,
        maxSupply: row.maxSupply ?? row.max_supply ?? null,
        foundCount: row.foundCount ?? row.found_count ?? null,
      });
    } catch {
      // linha inválida: ignora
    }
  }
  return rows;
}

/** Baixa a base do servidor se houver versão mais nova que a local. */
async function syncPlayersVersion(): Promise<{ version: number; imported: number }> {
  const localVersion = getLocalPlayersVersion();
  const info = await getPlayersVersion(localVersion);
  if (!info.downloadUrl || info.version <= localVersion) {
    return { version: localVersion, imported: 0 };
  }

  const rows = parsePlayersFile(await downloadPlayersVersionFile(info.version));
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    // found_count é atualizado pelo sync de progresso, não pela versão da base.
    upsertPlayers(rows.slice(i, i + BATCH_SIZE), { preserveFoundCount: true });
  }
  setLocalPlayersVersion(info.version);
  return { version: info.version, imported: rows.length };
}

/** Atualiza found/total das cartas com o progresso do servidor. */
async function syncPlayersProgress(): Promise<number> {
  const updates = await getPlayersProgress();
  applyPlayersProgressUpdates(
    updates.map((u) => ({ id: u.id, maxSupply: u.max_supply ?? null, foundCount: u.found_count ?? null })),
  );
  return updates.length;
}

/**
 * Mantém o SQLite em dia com o backend: versão da base + progresso das cartas.
 * Roda via React Query (`usePlayersSync`), que controla o intervalo (6h) e o refetch ao voltar o app.
 */
export async function syncPlayersDatabase(): Promise<PlayersSyncResult> {
  initPlayersDb();
  const { version, imported } = await syncPlayersVersion();
  const progressUpdated = await syncPlayersProgress();
  return { version, imported, progressUpdated };
}

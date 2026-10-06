import { inflate } from 'pako';

import {
  downloadPlayersVersionFile,
  getPlayersProgress,
  getPlayersVersion,
} from '@/lib/api/players-sync-api';
import {
  applyPlayersProgressUpdates,
  getCardsProgressVersion,
  getLocalPlayersVersion,
  initPlayersDb,
  setCardsProgressVersion,
  setLocalPlayersVersion,
  upsertPlayers,
} from '@/lib/db/playersDb';
import type { PlayerRow } from '@/types/player';

const BATCH_SIZE = 500;

/**
 * Quantas versões antes do cursor pedir de novo. Transações podem commitar fora de ordem
 * (a versão 101 aparecer depois da 102); reler essa janela evita perder o update.
 * É seguro repetir porque `found_count` é valor absoluto.
 */
const PROGRESS_OVERLAP = 50;

export type PlayersSyncResult = {
  /** Versão local da base depois do sync. */
  version: number;
  /** Jogadores gravados a partir de uma versão nova do servidor (0 se já estava em dia). */
  imported: number;
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

/**
 * Mantém o SQLite em dia com a versão da base de jogadores.
 * Roda via React Query (`usePlayersSync`), que controla o intervalo (6h) e o refetch ao voltar o app.
 */
export async function syncPlayersDatabase(): Promise<PlayersSyncResult> {
  initPlayersDb();
  return syncPlayersVersion();
}

/**
 * Delta sync do found/total das cartas: manda o cursor local e grava só o que mudou.
 * Cursor 0 (instalação nova) traz todas as cartas já encontradas.
 * Roda via React Query (`useCardsProgressSync`) a cada 60s. Retorna quantas cartas mudaram.
 */
export async function syncCardsProgress(): Promise<number> {
  initPlayersDb();
  const cursor = getCardsProgressVersion();
  const res = await getPlayersProgress(Math.max(0, cursor - PROGRESS_OVERLAP));
  applyPlayersProgressUpdates(
    res.items.map((u) => ({ id: u.id, maxSupply: u.max_supply ?? null, foundCount: u.found_count ?? null })),
  );
  const version = Math.max(cursor, Number(res.version) || 0);
  if (version !== cursor) setCardsProgressVersion(version);
  return res.items.length;
}

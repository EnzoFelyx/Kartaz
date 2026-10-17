import type { PlayerRow } from '@/types/player';

import { getDb } from './connection';
import { setCardsProgressVersion } from './metadata';
import { PLAYERS_COLUMNS, playerRowToSqlite } from './player-row-mapper';

const COLUMNS_SQL = PLAYERS_COLUMNS.join(',');
const PLACEHOLDERS_SQL = PLAYERS_COLUMNS.map(() => '?').join(',');
/** Colunas para UPDATE em conflito, excluindo found_count (preservar ao importar do zip). */
const UPDATE_ON_CONFLICT_SQL = PLAYERS_COLUMNS.filter((column) => column !== 'found_count')
  .map((column) => `${column}=excluded.${column}`)
  .join(',');

/**
 * Apaga todos os jogadores da base local (e zera o cursor do progresso das cartas, que é
 * por jogador). Exceção à regra de nunca remover: só para trocar a base embutida inteira.
 */
export function clearPlayers(): void {
  getDb().execSync('DELETE FROM players');
  setCardsProgressVersion(0);
}

/**
 * Insere ou atualiza jogadores em lote (transação).
 * Regra: nunca removemos jogadores — apenas insert ou update por id.
 * @param options.preserveFoundCount - quando true (ex.: importação do zip), não sobrescreve found_count nos registros existentes
 */
export function upsertPlayers(rows: PlayerRow[], options?: { preserveFoundCount?: boolean }): void {
  if (rows.length === 0) return;
  const database = getDb();
  const sql =
    options?.preserveFoundCount === true
      ? `INSERT INTO players (${COLUMNS_SQL}) VALUES (${PLACEHOLDERS_SQL}) ON CONFLICT(id) DO UPDATE SET ${UPDATE_ON_CONFLICT_SQL}`
      : `INSERT OR REPLACE INTO players (${COLUMNS_SQL}) VALUES (${PLACEHOLDERS_SQL})`;
  database.withTransactionSync(() => {
    for (const row of rows) {
      const values = playerRowToSqlite(row);
      database.runSync(sql, ...PLAYERS_COLUMNS.map((column) => values[column]));
    }
  });
}

export interface PlayerProgressUpdate {
  id: number;
  maxSupply: number | null;
  foundCount: number | null;
}

/**
 * Aplica updates de progresso (max_supply, found_count) para jogadores existentes.
 */
export function applyPlayersProgressUpdates(updates: PlayerProgressUpdate[]): void {
  if (updates.length === 0) return;
  const database = getDb();
  const sql = `UPDATE players
    SET max_supply = COALESCE(?, max_supply),
        found_count = COALESCE(?, found_count)
    WHERE id = ?`;
  database.withTransactionSync(() => {
    for (const u of updates) {
      database.runSync(sql, u.maxSupply, u.foundCount, u.id);
    }
  });
}

import { getDb } from './connection';

/*
 * Versões locais usadas na sincronização com o servidor: da base de jogadores e do progresso das
 * cartas (quantas cópias já foram encontradas).
 */

/**
 * Retorna a versão local da base de jogadores (0 se nunca sincronizou).
 */
export function getLocalPlayersVersion(): number {
  const row = getDb().getFirstSync<{ version: number }>('SELECT version FROM database_players_version WHERE id = 1');
  return row?.version ?? 0;
}

/**
 * Atualiza a versão local após import.
 */
export function setLocalPlayersVersion(version: number): void {
  getDb().runSync(
    'UPDATE database_players_version SET version = ?, updated_at = ? WHERE id = 1',
    version,
    new Date().toISOString(),
  );
}

/**
 * Versão local do progresso de cartas (para comparar com o servidor).
 * Fica na tabela app_metadata (linha única id = 1).
 */
export function getCardsProgressVersion(): number {
  const row = getDb().getFirstSync<{ cards_progress_version: number }>(
    'SELECT cards_progress_version FROM app_metadata WHERE id = 1',
  );
  return row?.cards_progress_version ?? 0;
}

export function setCardsProgressVersion(version: number): void {
  getDb().runSync(
    'UPDATE app_metadata SET cards_progress_version = ?, updated_at = ? WHERE id = 1',
    version,
    new Date().toISOString(),
  );
}

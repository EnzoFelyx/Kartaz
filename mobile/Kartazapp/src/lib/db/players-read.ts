import type { PlayerRow } from '@/types/player';

import { getDb } from './connection';
import { sqliteRowToPlayerRow, type SQLiteBindValue, type SqlitePlayerRow } from './player-row-mapper';

/**
 * Retorna um jogador pelo id, ou null se não existir.
 */
export function getPlayerById(id: number): PlayerRow | null {
  const row = getDb().getFirstSync<SqlitePlayerRow>('SELECT * FROM players WHERE id = ?', id);
  return row ? sqliteRowToPlayerRow(row) : null;
}

/**
 * Retorna lista única de nações (não vazias) para o modo globo/seleções.
 */
export function getUniqueNations(): string[] {
  const rows = getDb().getAllSync<{ nation: string | null }>(
    'SELECT DISTINCT TRIM(nation) AS nation FROM players WHERE TRIM(COALESCE(nation, "")) != "" ORDER BY nation ASC',
  );
  const list: string[] = [];
  for (const r of rows) {
    if (r.nation) list.push(r.nation);
  }
  return list;
}

export interface SearchPlayersParams {
  /** Busca por nome, time ou seleção (LIKE, sem diferenciar maiúsculas). */
  query?: string;
  /** Restringe a uma seleção (nome exato, sem diferenciar maiúsculas). */
  nation?: string;
  limit: number;
  offset?: number;
}

/** Monta o WHERE da busca/seleção (função pura: só texto SQL e argumentos). */
export function buildPlayersFilter({ query, nation }: Pick<SearchPlayersParams, 'query' | 'nation'>) {
  const conditions: string[] = [];
  const args: SQLiteBindValue[] = [];
  const nationName = nation?.trim();
  if (nationName) {
    conditions.push('LOWER(TRIM(nation)) = LOWER(?)');
    args.push(nationName);
  }
  const q = query?.trim();
  if (q) {
    const pattern = `%${q}%`;
    // Dentro de uma seleção, a busca é só pelo nome do jogador.
    if (nationName) {
      conditions.push('name LIKE ?');
      args.push(pattern);
    } else {
      conditions.push('(name LIKE ? OR team LIKE ? OR nation LIKE ?)');
      args.push(pattern, pattern, pattern);
    }
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { where, args };
}

/**
 * Página do catálogo ordenada por rank (menor = melhor), com busca e filtro de seleção opcionais.
 * Base da paginação das listas (offset = página * limit).
 */
export function searchPlayers({ query, nation, limit, offset = 0 }: SearchPlayersParams): PlayerRow[] {
  const { where, args } = buildPlayersFilter({ query, nation });
  const rows = getDb().getAllSync<SqlitePlayerRow>(
    `SELECT * FROM players ${where} ORDER BY rank ASC LIMIT ? OFFSET ?`,
    ...args,
    limit,
    offset,
  );
  return rows.map(sqliteRowToPlayerRow);
}

/** Quantos jogadores batem com a busca/seleção (para o subtítulo das listas). */
export function countPlayers(params: Pick<SearchPlayersParams, 'query' | 'nation'> = {}): number {
  const { where, args } = buildPlayersFilter(params);
  const row = getDb().getFirstSync<{ total: number }>(`SELECT COUNT(*) AS total FROM players ${where}`, ...args);
  return row?.total ?? 0;
}

/**
 * Jogadores parecidos com `player`: mesma posição primeiro, depois o overall mais próximo.
 */
export function getSimilarPlayers(player: PlayerRow, limit: number): PlayerRow[] {
  const rows = getDb().getAllSync<SqlitePlayerRow>(
    `SELECT * FROM players WHERE id != ?
      ORDER BY (position = ?) DESC, ABS(COALESCE(ovr, 0) - ?) ASC, rank ASC
      LIMIT ?`,
    player.id,
    player.position ?? '',
    player.ovr ?? 0,
    limit,
  );
  return rows.map(sqliteRowToPlayerRow);
}

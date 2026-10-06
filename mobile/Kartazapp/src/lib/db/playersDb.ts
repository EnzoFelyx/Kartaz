import * as SQLite from 'expo-sqlite';
import {
  DB_NAME,
  CREATE_PLAYERS_TABLE,
  CREATE_VERSION_TABLE,
  CREATE_APP_METADATA_TABLE,
  CREATE_INDEXES,
  INIT_VERSION_ROW,
  INIT_APP_METADATA_ROW,
} from './schema';
import type { PlayerRow } from '@/types/player';

/** Valores para binding SQLite (expo-sqlite aceita string | number | null | boolean | Uint8Array). */
type SQLiteBindValue = string | number | null | boolean | Uint8Array;

let db: SQLite.SQLiteDatabase | null = null;

function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync(DB_NAME);
  }
  return db;
}

/**
 * Migra bancos antigos: cria app_metadata se faltar e adiciona max_supply/found_count em players.
 */
function migrateSchema(database: SQLite.SQLiteDatabase): void {
  // Tabela app_metadata (nova)
  const tables = database.getAllSync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='app_metadata'"
  );
  if (tables.length === 0) {
    database.execSync(CREATE_APP_METADATA_TABLE);
    database.execSync(INIT_APP_METADATA_ROW);
  }

  // Colunas novas em players
  const columns = database.getAllSync<{ name: string }>('PRAGMA table_info(players)');
  const columnNames = new Set(columns.map((c) => c.name));
  if (!columnNames.has('max_supply')) {
    database.execSync('ALTER TABLE players ADD COLUMN max_supply INTEGER');
  }
  if (!columnNames.has('found_count')) {
    database.execSync('ALTER TABLE players ADD COLUMN found_count INTEGER');
  }
}

/**
 * Inicializa o schema (tabelas e versão). Idempotente.
 * Roda migrações para bancos criados com schema antigo.
 */
export function initPlayersDb(): void {
  const database = getDb();
  database.execSync(CREATE_VERSION_TABLE);
  database.execSync(CREATE_PLAYERS_TABLE);
  database.execSync(CREATE_INDEXES);
  database.execSync(INIT_VERSION_ROW);
  migrateSchema(database);
  // Garante app_metadata e linha inicial (migrate pode já ter criado)
  database.execSync(CREATE_APP_METADATA_TABLE);
  database.execSync(INIT_APP_METADATA_ROW);
}

/**
 * Retorna a versão local da base de jogadores (0 se nunca sincronizou).
 */
export function getLocalPlayersVersion(): number {
  const database = getDb();
  const row = database.getFirstSync<{ version: number }>(
    'SELECT version FROM database_players_version WHERE id = 1'
  );
  return row?.version ?? 0;
}

/**
 * Atualiza a versão local após import.
 */
export function setLocalPlayersVersion(version: number): void {
  const database = getDb();
  database.runSync(
    'UPDATE database_players_version SET version = ?, updated_at = ? WHERE id = 1',
    version,
    new Date().toISOString()
  );
}

/**
 * Versão local do progresso de cartas (para comparar com o servidor).
 * Fica na tabela app_metadata (linha única id = 1).
 */
export function getCardsProgressVersion(): number {
  const database = getDb();
  const row = database.getFirstSync<{ cards_progress_version: number }>(
    'SELECT cards_progress_version FROM app_metadata WHERE id = 1'
  );
  return row?.cards_progress_version ?? 0;
}

export function setCardsProgressVersion(version: number): void {
  const database = getDb();
  database.runSync(
    'UPDATE app_metadata SET cards_progress_version = ?, updated_at = ? WHERE id = 1',
    version,
    new Date().toISOString()
  );
}

/** Converte uma linha do NDJSON (camelCase) para valores na ordem das colunas SQLite (snake_case). */
function playerRowToSqlite(row: PlayerRow): Record<string, SQLiteBindValue> {
  return {
    id: row.id,
    rank: row.rank ?? null,
    name: row.name,
    gender: row.gender ?? null,
    ovr: row.ovr ?? null,
    pac: row.pac ?? null,
    sho: row.sho ?? null,
    pas: row.pas ?? null,
    dri: row.dri ?? null,
    def: row.def ?? null,
    phy: row.phy ?? null,
    acceleration: row.acceleration ?? null,
    sprint_speed: row.sprintSpeed ?? null,
    positioning: row.positioning ?? null,
    finishing: row.finishing ?? null,
    shot_power: row.shotPower ?? null,
    long_shots: row.longShots ?? null,
    volleys: row.volleys ?? null,
    penalties: row.penalties ?? null,
    vision: row.vision ?? null,
    crossing: row.crossing ?? null,
    free_kick_acc: row.freeKickAcc ?? null,
    short_passing: row.shortPassing ?? null,
    long_passing: row.longPassing ?? null,
    curve: row.curve ?? null,
    dribbling: row.dribbling ?? null,
    agility: row.agility ?? null,
    balance: row.balance ?? null,
    reactions: row.reactions ?? null,
    ball_control: row.ballControl ?? null,
    composure: row.composure ?? null,
    interceptions: row.interceptions ?? null,
    heading_acc: row.headingAcc ?? null,
    def_awareness: row.defAwareness ?? null,
    standing_tackle: row.standingTackle ?? null,
    sliding_tackle: row.slidingTackle ?? null,
    jumping: row.jumping ?? null,
    stamina: row.stamina ?? null,
    strength: row.strength ?? null,
    aggression: row.aggression ?? null,
    position: row.position ?? null,
    weak_foot: row.weakFoot ?? null,
    skill_moves: row.skillMoves ?? null,
    preferred_foot: row.preferredFoot ?? null,
    height_raw: row.heightRaw ?? null,
    weight_raw: row.weightRaw ?? null,
    alternative_positions: JSON.stringify(row.alternativePositions ?? []),
    play_style: JSON.stringify(row.playStyle ?? []),
    age: row.age ?? null,
    nation: row.nation ?? null,
    league: row.league ?? null,
    team: row.team ?? null,
    url: row.url ?? null,
    gk_diving: row.gkDiving ?? null,
    gk_handling: row.gkHandling ?? null,
    gk_kicking: row.gkKicking ?? null,
    gk_positioning: row.gkPositioning ?? null,
    gk_reflexes: row.gkReflexes ?? null,
    max_supply: row.maxSupply ?? null,
    found_count: row.foundCount ?? null,
    card_updated_at: row.cardUpdatedAt ?? null,
    created_at: row.createdAt ?? null,
    updated_at: row.updatedAt ?? null,
  };
}

const PLAYERS_COLUMNS =
  'id,rank,name,gender,ovr,pac,sho,pas,dri,def,phy,' +
  'acceleration,sprint_speed,positioning,finishing,shot_power,long_shots,volleys,penalties,' +
  'vision,crossing,free_kick_acc,short_passing,long_passing,curve,dribbling,agility,balance,' +
  'reactions,ball_control,composure,interceptions,heading_acc,def_awareness,' +
  'standing_tackle,sliding_tackle,jumping,stamina,strength,aggression,' +
  'position,weak_foot,skill_moves,preferred_foot,height_raw,weight_raw,' +
  'alternative_positions,play_style,age,nation,league,team,url,' +
  'gk_diving,gk_handling,gk_kicking,gk_positioning,gk_reflexes,' +
  'max_supply,found_count,' +
  'card_updated_at,created_at,updated_at';

const PLAYERS_PLACEHOLDERS = PLAYERS_COLUMNS.split(',')
  .map(() => '?')
  .join(',');

/** Colunas para UPDATE em conflito, excluindo found_count (preservar ao importar do zip). */
const PLAYERS_UPDATE_ON_CONFLICT = PLAYERS_COLUMNS.split(',')
  .filter((c) => c.trim() !== 'found_count')
  .map((c) => `${c.trim()}=excluded.${c.trim()}`)
  .join(',');

/**
 * Insere ou atualiza jogadores em lote (transação).
 * Regra: nunca removemos jogadores — apenas insert ou update por id.
 * @param options.preserveFoundCount - quando true (ex.: importação do zip), não sobrescreve found_count nos registros existentes
 */
export function upsertPlayers(
  rows: PlayerRow[],
  options?: { preserveFoundCount?: boolean }
): void {
  if (rows.length === 0) return;
  const database = getDb();
  const preserveFoundCount = options?.preserveFoundCount === true;
  const sql = preserveFoundCount
    ? `INSERT INTO players (${PLAYERS_COLUMNS}) VALUES (${PLAYERS_PLACEHOLDERS}) ON CONFLICT(id) DO UPDATE SET ${PLAYERS_UPDATE_ON_CONFLICT}`
    : `INSERT OR REPLACE INTO players (${PLAYERS_COLUMNS}) VALUES (${PLAYERS_PLACEHOLDERS})`;
  database.withTransactionSync(() => {
    for (const row of rows) {
      const o = playerRowToSqlite(row);
      database.runSync(
        sql,
        o.id,
        o.rank,
        o.name,
        o.gender,
        o.ovr,
        o.pac,
        o.sho,
        o.pas,
        o.dri,
        o.def,
        o.phy,
        o.acceleration,
        o.sprint_speed,
        o.positioning,
        o.finishing,
        o.shot_power,
        o.long_shots,
        o.volleys,
        o.penalties,
        o.vision,
        o.crossing,
        o.free_kick_acc,
        o.short_passing,
        o.long_passing,
        o.curve,
        o.dribbling,
        o.agility,
        o.balance,
        o.reactions,
        o.ball_control,
        o.composure,
        o.interceptions,
        o.heading_acc,
        o.def_awareness,
        o.standing_tackle,
        o.sliding_tackle,
        o.jumping,
        o.stamina,
        o.strength,
        o.aggression,
        o.position,
        o.weak_foot,
        o.skill_moves,
        o.preferred_foot,
        o.height_raw,
        o.weight_raw,
        o.alternative_positions,
        o.play_style,
        o.age,
        o.nation,
        o.league,
        o.team,
        o.url,
        o.gk_diving,
        o.gk_handling,
        o.gk_kicking,
        o.gk_positioning,
        o.gk_reflexes,
        o.max_supply,
        o.found_count,
        o.card_updated_at,
        o.created_at,
        o.updated_at
      );
    }
  });
}

/** Linha lida do SQLite (nomes em snake_case). */
interface SqlitePlayerRow {
  id: number;
  rank: number | null;
  name: string;
  gender: string | null;
  ovr: number | null;
  pac: number | null;
  sho: number | null;
  pas: number | null;
  dri: number | null;
  def: number | null;
  phy: number | null;
  acceleration: number | null;
  sprint_speed: number | null;
  positioning: number | null;
  finishing: number | null;
  shot_power: number | null;
  long_shots: number | null;
  volleys: number | null;
  penalties: number | null;
  vision: number | null;
  crossing: number | null;
  free_kick_acc: number | null;
  short_passing: number | null;
  long_passing: number | null;
  curve: number | null;
  dribbling: number | null;
  agility: number | null;
  balance: number | null;
  reactions: number | null;
  ball_control: number | null;
  composure: number | null;
  interceptions: number | null;
  heading_acc: number | null;
  def_awareness: number | null;
  standing_tackle: number | null;
  sliding_tackle: number | null;
  jumping: number | null;
  stamina: number | null;
  strength: number | null;
  aggression: number | null;
  position: string | null;
  weak_foot: number | null;
  skill_moves: number | null;
  preferred_foot: string | null;
  height_raw: string | null;
  weight_raw: string | null;
  alternative_positions: string | null;
  play_style: string | null;
  age: number | null;
  nation: string | null;
  league: string | null;
  team: string | null;
  url: string | null;
  gk_diving: number | null;
  gk_handling: number | null;
  gk_kicking: number | null;
  gk_positioning: number | null;
  gk_reflexes: number | null;
  max_supply: number | null;
  found_count: number | null;
  card_updated_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

function parseJsonArray(value: string | null): string[] {
  if (value == null || value === '') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function sqliteRowToPlayerRow(r: SqlitePlayerRow): PlayerRow {
  return {
    id: r.id,
    rank: r.rank ?? null,
    name: r.name,
    gender: r.gender ?? null,
    ovr: r.ovr ?? null,
    pac: r.pac ?? null,
    sho: r.sho ?? null,
    pas: r.pas ?? null,
    dri: r.dri ?? null,
    def: r.def ?? null,
    phy: r.phy ?? null,
    acceleration: r.acceleration ?? null,
    sprintSpeed: r.sprint_speed ?? null,
    positioning: r.positioning ?? null,
    finishing: r.finishing ?? null,
    shotPower: r.shot_power ?? null,
    longShots: r.long_shots ?? null,
    volleys: r.volleys ?? null,
    penalties: r.penalties ?? null,
    vision: r.vision ?? null,
    crossing: r.crossing ?? null,
    freeKickAcc: r.free_kick_acc ?? null,
    shortPassing: r.short_passing ?? null,
    longPassing: r.long_passing ?? null,
    curve: r.curve ?? null,
    dribbling: r.dribbling ?? null,
    agility: r.agility ?? null,
    balance: r.balance ?? null,
    reactions: r.reactions ?? null,
    ballControl: r.ball_control ?? null,
    composure: r.composure ?? null,
    interceptions: r.interceptions ?? null,
    headingAcc: r.heading_acc ?? null,
    defAwareness: r.def_awareness ?? null,
    standingTackle: r.standing_tackle ?? null,
    slidingTackle: r.sliding_tackle ?? null,
    jumping: r.jumping ?? null,
    stamina: r.stamina ?? null,
    strength: r.strength ?? null,
    aggression: r.aggression ?? null,
    position: r.position ?? null,
    weakFoot: r.weak_foot ?? null,
    skillMoves: r.skill_moves ?? null,
    preferredFoot: r.preferred_foot ?? null,
    heightRaw: r.height_raw ?? null,
    weightRaw: r.weight_raw ?? null,
    alternativePositions: parseJsonArray(r.alternative_positions),
    playStyle: parseJsonArray(r.play_style),
    age: r.age ?? null,
    nation: r.nation ?? null,
    league: r.league ?? null,
    team: r.team ?? null,
    url: r.url ?? null,
    gkDiving: r.gk_diving ?? null,
    gkHandling: r.gk_handling ?? null,
    gkKicking: r.gk_kicking ?? null,
    gkPositioning: r.gk_positioning ?? null,
    gkReflexes: r.gk_reflexes ?? null,
    maxSupply: r.max_supply ?? null,
    foundCount: r.found_count ?? null,
    cardUpdatedAt: r.card_updated_at ?? null,
    createdAt: r.created_at ?? '',
    updatedAt: r.updated_at ?? '',
  };
}

/**
 * Busca os primeiros `limit` jogadores ordenados por rank (menor = melhor).
 * Retorna array com stats em camelCase (PlayerRow).
 */
export function getTopPlayersByRank(limit: number): PlayerRow[] {
  const database = getDb();
  const sql = `SELECT * FROM players ORDER BY rank ASC LIMIT ?`;
  const rows = database.getAllSync<SqlitePlayerRow>(sql, limit);
  return rows.map(sqliteRowToPlayerRow);
}

/**
 * Retorna um jogador pelo id, ou null se não existir.
 */
export function getPlayerById(id: number): PlayerRow | null {
  const database = getDb();
  const row = database.getFirstSync<SqlitePlayerRow>(
    'SELECT * FROM players WHERE id = ?',
    id
  );
  return row ? sqliteRowToPlayerRow(row) : null;
}

/**
 * Busca jogadores por nome, time ou nação (case-insensitive LIKE).
 * Ordena por rank. limit = tamanho da página, offset = página * limit (paginação).
 */
export function getPlayersSearch(
  query: string,
  limit: number,
  offset: number = 0
): PlayerRow[] {
  const database = getDb();
  const q = query.trim();
  if (!q) {
    const sql = `SELECT * FROM players ORDER BY rank ASC LIMIT ? OFFSET ?`;
    const rows = database.getAllSync<SqlitePlayerRow>(sql, limit, offset);
    return rows.map(sqliteRowToPlayerRow);
  }
  const pattern = `%${q}%`;
  const sql = `SELECT * FROM players
    WHERE name LIKE ? OR team LIKE ? OR nation LIKE ?
    ORDER BY rank ASC LIMIT ? OFFSET ?`;
  const rows = database.getAllSync<SqlitePlayerRow>(
    sql,
    pattern,
    pattern,
    pattern,
    limit,
    offset
  );
  return rows.map(sqliteRowToPlayerRow);
}

/**
 * Retorna jogadores cuja nação coincide (case-insensitive). Usado no seletor globo (por nation).
 */
export function getPlayersByNation(nation: string): PlayerRow[] {
  const database = getDb();
  const name = nation.trim();
  if (!name) return [];
  const sql = `SELECT * FROM players
    WHERE LOWER(TRIM(nation)) = LOWER(?)
    ORDER BY rank ASC`;
  const rows = database.getAllSync<SqlitePlayerRow>(sql, name);
  return rows.map(sqliteRowToPlayerRow);
}

/**
 * Retorna lista única de nações (não vazias) para o modo globo/seleções.
 */
export function getUniqueNations(): string[] {
  const database = getDb();
  const rows = database.getAllSync<{ nation: string | null }>(
    'SELECT DISTINCT TRIM(nation) AS nation FROM players WHERE TRIM(COALESCE(nation, "")) != "" ORDER BY nation ASC'
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

function buildPlayersFilter({ query, nation }: Pick<SearchPlayersParams, 'query' | 'nation'>) {
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
  const database = getDb();
  const { where, args } = buildPlayersFilter({ query, nation });
  const rows = database.getAllSync<SqlitePlayerRow>(
    `SELECT * FROM players ${where} ORDER BY rank ASC LIMIT ? OFFSET ?`,
    ...args,
    limit,
    offset
  );
  return rows.map(sqliteRowToPlayerRow);
}

/** Quantos jogadores batem com a busca/seleção (para o subtítulo das listas). */
export function countPlayers(params: Pick<SearchPlayersParams, 'query' | 'nation'> = {}): number {
  const database = getDb();
  const { where, args } = buildPlayersFilter(params);
  const row = database.getFirstSync<{ total: number }>(
    `SELECT COUNT(*) AS total FROM players ${where}`,
    ...args
  );
  return row?.total ?? 0;
}

/**
 * Jogadores parecidos com `player`: mesma posição primeiro, depois o overall mais próximo.
 */
export function getSimilarPlayers(player: PlayerRow, limit: number): PlayerRow[] {
  const database = getDb();
  const rows = database.getAllSync<SqlitePlayerRow>(
    `SELECT * FROM players WHERE id != ?
      ORDER BY (position = ?) DESC, ABS(COALESCE(ovr, 0) - ?) ASC, rank ASC
      LIMIT ?`,
    player.id,
    player.position ?? '',
    player.ovr ?? 0,
    limit
  );
  return rows.map(sqliteRowToPlayerRow);
}

/**
 * Retorna até `limit` jogadores aleatórios da base (para seed de "Minha Coleção").
 * Só retorna jogadores que existem no banco offline.
 */
export function getRandomPlayers(limit: number): PlayerRow[] {
  const database = getDb();
  const sql = `SELECT * FROM players ORDER BY RANDOM() LIMIT ?`;
  const rows = database.getAllSync<SqlitePlayerRow>(sql, limit);
  return rows.map(sqliteRowToPlayerRow);
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

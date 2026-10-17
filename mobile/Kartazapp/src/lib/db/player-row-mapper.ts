import type { PlayerRow } from '@/types/player';

/*
 * Conversão entre o jogador do app (`PlayerRow`, camelCase) e a linha da tabela `players` do SQLite
 * (snake_case). Funções puras, sem acesso ao banco.
 */

/** Valores para binding SQLite (expo-sqlite aceita string | number | null | boolean | Uint8Array). */
export type SQLiteBindValue = string | number | null | boolean | Uint8Array;

/** Colunas da tabela `players`, na ordem do INSERT. */
export const PLAYERS_COLUMNS = [
  'id',
  'rank',
  'name',
  'gender',
  'ovr',
  'pac',
  'sho',
  'pas',
  'dri',
  'def',
  'phy',
  'acceleration',
  'sprint_speed',
  'positioning',
  'finishing',
  'shot_power',
  'long_shots',
  'volleys',
  'penalties',
  'vision',
  'crossing',
  'free_kick_acc',
  'short_passing',
  'long_passing',
  'curve',
  'dribbling',
  'agility',
  'balance',
  'reactions',
  'ball_control',
  'composure',
  'interceptions',
  'heading_acc',
  'def_awareness',
  'standing_tackle',
  'sliding_tackle',
  'jumping',
  'stamina',
  'strength',
  'aggression',
  'position',
  'weak_foot',
  'skill_moves',
  'preferred_foot',
  'height_raw',
  'weight_raw',
  'alternative_positions',
  'play_style',
  'age',
  'nation',
  'league',
  'team',
  'url',
  'gk_diving',
  'gk_handling',
  'gk_kicking',
  'gk_positioning',
  'gk_reflexes',
  'max_supply',
  'found_count',
  'card_updated_at',
  'created_at',
  'updated_at',
] as const;

export type PlayerColumn = (typeof PLAYERS_COLUMNS)[number];

/** Converte uma linha do NDJSON (camelCase) para valores na ordem das colunas SQLite (snake_case). */
export function playerRowToSqlite(row: PlayerRow): Record<PlayerColumn, SQLiteBindValue> {
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

/** Linha lida do SQLite (nomes em snake_case). */
export interface SqlitePlayerRow {
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

export function sqliteRowToPlayerRow(r: SqlitePlayerRow): PlayerRow {
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

/**
 * Schema SQLite alinhado ao backend (tabelas players e database_players_version).
 * Arrays (alternativePositions, playStyle) são armazenados como JSON text.
 */

export const DB_NAME = 'gorocketleague.db';

export const CREATE_VERSION_TABLE = `
CREATE TABLE IF NOT EXISTS database_players_version (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT
);
`;

export const CREATE_APP_METADATA_TABLE = `
CREATE TABLE IF NOT EXISTS app_metadata (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  cards_progress_version INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT
);
`;

export const CREATE_PLAYERS_TABLE = `
CREATE TABLE IF NOT EXISTS players (
  id INTEGER PRIMARY KEY,
  rank INTEGER,
  name TEXT NOT NULL,
  gender TEXT,

  ovr INTEGER, pac INTEGER, sho INTEGER, pas INTEGER, dri INTEGER, def INTEGER, phy INTEGER,

  acceleration INTEGER, sprint_speed INTEGER, positioning INTEGER, finishing INTEGER,
  shot_power INTEGER, long_shots INTEGER, volleys INTEGER, penalties INTEGER,
  vision INTEGER, crossing INTEGER, free_kick_acc INTEGER, short_passing INTEGER,
  long_passing INTEGER, curve INTEGER, dribbling INTEGER, agility INTEGER,
  balance INTEGER, reactions INTEGER, ball_control INTEGER, composure INTEGER,
  interceptions INTEGER, heading_acc INTEGER, def_awareness INTEGER,
  standing_tackle INTEGER, sliding_tackle INTEGER, jumping INTEGER,
  stamina INTEGER, strength INTEGER, aggression INTEGER,

  position TEXT, weak_foot INTEGER, skill_moves INTEGER, preferred_foot TEXT,
  height_raw TEXT, weight_raw TEXT,
  alternative_positions TEXT,
  play_style TEXT,

  age INTEGER, nation TEXT, league TEXT, team TEXT, url TEXT,

  gk_diving INTEGER, gk_handling INTEGER, gk_kicking INTEGER,
  gk_positioning INTEGER, gk_reflexes INTEGER,

  max_supply INTEGER,
  found_count INTEGER,

  card_updated_at TEXT, created_at TEXT, updated_at TEXT
);
`;

/** Índices para buscas comuns (nome, overall, seleção, time). */
export const CREATE_INDEXES = `
CREATE INDEX IF NOT EXISTS idx_players_name ON players(name);
CREATE INDEX IF NOT EXISTS idx_players_ovr ON players(ovr);
CREATE INDEX IF NOT EXISTS idx_players_nation ON players(nation);
CREATE INDEX IF NOT EXISTS idx_players_team ON players(team);
`;

export const INIT_VERSION_ROW = `
INSERT OR IGNORE INTO database_players_version (id, version, updated_at) VALUES (1, 0, NULL);
`;

export const INIT_APP_METADATA_ROW = `
INSERT OR IGNORE INTO app_metadata (id, cards_progress_version, updated_at) VALUES (1, 0, NULL);
`;

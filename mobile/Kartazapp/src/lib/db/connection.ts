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

let db: SQLite.SQLiteDatabase | null = null;

/** Banco local do catálogo de jogadores (aberto uma vez e reaproveitado). */
export function getDb(): SQLite.SQLiteDatabase {
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
    "SELECT name FROM sqlite_master WHERE type='table' AND name='app_metadata'",
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

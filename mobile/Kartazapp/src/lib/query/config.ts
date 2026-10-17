/** Tempo padrão em que uma query é considerada atual (não refaz ao montar/focar). */
export const DEFAULT_STALE_TIME_MS = 60 * 1000;

/** Itens por página nas listas paginadas (coleção, catálogo, cópias encontradas). */
export const LIST_PAGE_SIZE = 20;

/** Espera para buscar enquanto o usuário digita: no SQLite (rápido) e no servidor (rede). */
export const LOCAL_SEARCH_DEBOUNCE_MS = 250;
export const REMOTE_SEARCH_DEBOUNCE_MS = 400;

/*
 * Regras do jogo que o app precisa conhecer. O backend é a fonte da verdade: quem cobra, sorteia e
 * calcula de verdade é o servidor. Ao mudar um valor lá, mudar aqui também (arquivo indicado em cada um).
 */

/** Energia máxima padrão, antes de a sala responder (`DEFAULT_MAX_FUEL` no `CellRoom.js`). */
export const DEFAULT_MAX_ENERGY = 100;

/** Energia gasta por uso do radar, em % da máxima (`config/radarConfig.js`). */
export const RADAR_COST_PERCENT = 10;

/** Total de cópias de uma carta quando o backend não informa (default do Prisma). */
export const DEFAULT_MAX_SUPPLY = 1000;

/** Titulares do time. */
export const LINEUP_SIZE = 5;

export type BonusTier = { count: number; percent: number };

/**
 * Bônus por seleção pelo tamanho do grupo (`services/teamService.js`).
 * Para em 4 jogadores: um grupo de 5 vale o mesmo que um de 4.
 */
export const NATION_BONUS_TABLE: readonly BonusTier[] = [
  { count: 2, percent: 0.625 },
  { count: 3, percent: 1.25 },
  { count: 4, percent: 3.75 },
];

/** Bônus por clube pelo tamanho do grupo (`services/teamService.js`). Soma com o de seleção. */
export const CLUB_BONUS_TABLE: readonly BonusTier[] = [
  { count: 2, percent: 0.5 },
  { count: 3, percent: 1 },
  { count: 4, percent: 3 },
];

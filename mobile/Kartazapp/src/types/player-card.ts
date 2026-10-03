export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

/** Atributos do jogador (0–100). */
export type PlayerStats = {
  speed: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defense: number;
  physical: number;
};

/** Cópia única de uma carta (jogador + número serial), como no contrato da API. */
export type PlayerCard = {
  id: string;
  name: string;
  nation: string;
  /** Código curto da seleção (ex.: BRA). */
  nationCode: string;
  position: string;
  rating: number;
  rarity: Rarity;
  serial: number;
  maxSerial: number;
  /** ISO date de quando a carta foi coletada. */
  collectedAt: string;
  stats: PlayerStats;
};

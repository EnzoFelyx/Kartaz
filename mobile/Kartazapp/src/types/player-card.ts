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

/** Jogador do catálogo (independe de quem possui cópias dele). */
export type Player = {
  id: string;
  name: string;
  nation: string;
  /** Código curto da seleção (ex.: BRA). */
  nationCode: string;
  position: string;
  rating: number;
  rarity: Rarity;
  stats: PlayerStats;
  /** Cópias deste jogador já encontradas por todos os jogadores do jogo. */
  copiesFound: number;
  /** Total de cópias existentes (ex.: 1000). */
  totalCopies: number;
};

/** Cópia única de uma carta (jogador + número serial), como no contrato da API. */
export type PlayerCard = Player & {
  serial: number;
  maxSerial: number;
  /** ISO date de quando a carta foi coletada. */
  collectedAt: string;
  /** Onde (no mapa virtual) a cópia foi coletada. */
  collectedLocation: string;
  /** Propostas de troca recebidas por esta cópia. */
  tradeOffers: number;
};

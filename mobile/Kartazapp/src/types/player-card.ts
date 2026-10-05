import type en from '@/i18n/locales/en.json';

/** Código FIFA da seleção (ex.: BRA); o nome vem de `nations.<código>` no i18n. */
export type NationCode = keyof typeof en.nations;

/** Cidade conhecida (nome em `cities.<id>` no i18n). */
export type CityId = keyof typeof en.cities;

/** Sigla da posição (ex.: ST); o texto exibido vem de `positions.<sigla>` no i18n. */
export type Position = keyof typeof en.positions;

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
  /** Código curto da seleção (ex.: BRA). */
  nationCode: NationCode;
  position: Position;
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
  collectedLocation: { city: CityId; nationCode: NationCode };
  /** Propostas de troca recebidas por esta cópia. */
  tradeOffers: number;
};

/** Cópia de um jogador encontrada por alguém no jogo (vista na tela "Encontradas"). */
export type FoundCopy = {
  serial: number;
  maxSerial: number;
  /** Apelido de quem possui a cópia. */
  owner: string;
  /** ISO date de quando a cópia foi encontrada. */
  foundAt: string;
  foundLocation: { city: CityId; nationCode: NationCode };
  /** Propostas de troca recebidas por esta cópia. */
  tradeOffers: number;
};

import type en from '@/i18n/locales/en.json';

/** Código FIFA de uma seleção com nome traduzido no i18n (ex.: BRA → `nations.BRA`). */
export type NationCode = keyof typeof en.nations;

/** Sigla de posição com tradução no i18n (ex.: ST → `positions.ST`). */
export type KnownPosition = keyof typeof en.positions;

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
  /** Id do jogador no backend (o mesmo do SQLite local). */
  id: number;
  name: string;
  /** Seleção como vem do backend (nome em inglês, ex.: "Brazil"). */
  nation: string;
  /** Bandeira em emoji da seleção, quando conhecida. */
  flagEmoji: string | null;
  /** Clube do jogador (ex.: "Liverpool"); vazio quando a base não informa. */
  team: string;
  /** Sigla da posição como vem do backend (ex.: ST, LM). */
  position: string;
  /** Posição no ranking geral (1 = melhor). */
  rank: number | null;
  rating: number;
  rarity: Rarity;
  stats: PlayerStats;
  /** Foto do jogador (backend ou servidor de fotos configurado); sem foto, a carta mostra o fundo padrão. */
  imageUri?: string;
  /** Cópias deste jogador já encontradas por todos os jogadores do jogo. */
  copiesFound: number;
  /** Total de cópias existentes (ex.: 1000). */
  totalCopies: number;
};

/** Onde uma cópia foi encontrada (cidade/estado reais, quando o backend souber). */
export type FoundLocation = {
  city: string | null;
  state: string | null;
  /** Coordenadas da coleta: mostradas quando não há cidade/estado (cartas do mapa). */
  lat?: number | null;
  lng?: number | null;
};

/** Cópia única de uma carta do usuário (jogador + número serial), vinda de `GET /user/instances`. */
export type PlayerCard = Player & {
  /** Id da cópia (`Instance.id`, uuid). */
  instanceId: string;
  serial: number;
  maxSerial: number;
  /** ISO date de quando a carta foi coletada. */
  collectedAt: string;
  collectedLocation: FoundLocation;
  /** Propostas de troca recebidas por esta cópia (o backend ainda não informa). */
  tradeOffers: number;
};

/** Cópia de um jogador encontrada por alguém no jogo (vista na tela "Encontradas"). */
export type FoundCopy = {
  /** Id da cópia (`Instance.id`, uuid). */
  id: string;
  serial: number;
  maxSerial: number;
  /** Apelido de quem possui a cópia. */
  owner: string;
  /** ISO date de quando a cópia foi encontrada. */
  foundAt: string;
  foundLocation: FoundLocation;
  /** Propostas de troca recebidas por esta cópia (o backend ainda não informa). */
  tradeOffers: number;
};

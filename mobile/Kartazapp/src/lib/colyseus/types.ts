/** Contrato da sala `cell` do backend (ver backend/src/colyseus/CELL_ROOM_JOIN_OPTIONS.md). */

export type JoinCellOptions = {
  userId: string;
  /** Célula da sala (res 8) — o matchmaking agrupa por ela (`filterBy(["h3RoomCell"])`). */
  h3RoomCell: string;
  /** Célula do usuário (res 9). */
  h3UserCell: string;
  lat: number;
  lng: number;
  fuel: number;
  xp: number;
  level: number;
  username?: string;
  avatarId?: string;
};

/** Jogador da sala como chega em `room.state.users` (só os campos que o app usa). */
export type CellUser = {
  sessionId: string;
  id: string;
  username: string;
  avatar: string;
  avatarId: string;
  level: number;
  lat: number;
  lng: number;
  h3UserCell: string;
};

/** Servidor → app quando o jogador cruza para outra célula de sala. */
export type ChangeRoomMessage = {
  handoffId: string;
  /** `"cell:<h3RoomCell>"`. */
  newRoom: string;
  fuel: number;
  lat: number;
  lng: number;
  h3UserCell: string;
  xp: number;
  level: number;
};

/** Bandeira de descoberta: área (res 8) que ninguém coletou ainda, com o centro onde ela fica. */
export type DiscoveryFlag = {
  h3Index: string;
  lat: number;
  lng: number;
};

/** Moeda da sala (`room.state.coins`): fica parada na coordenada até alguém coletar. */
export type CellCoin = {
  id: string;
  lat: number;
  lng: number;
  value: number;
};

/**
 * Carta no mapa da sala (`room.state.cards`), virada para baixo: o app só usa a posição — quem é
 * o jogador fica escondido até a coleta.
 */
export type CellCard = {
  id: string;
  lat: number;
  lng: number;
};

/** Bateria da sala (`room.state.batteries`): recarrega energia de quem passar por cima dela. */
export type CellBattery = {
  id: string;
  lat: number;
  lng: number;
};

/** Servidor → quem coletou uma moeda (coleta automática ao passar por cima dela). */
export type RoomCoinGranted = {
  coinId: string;
  value: number;
  /** Saldo da carteira depois da coleta. */
  balance: number;
};

/** Classe da série de uma cópia (servidor): nº 1 ou o último = `extreme`; nºs baixos = `elite`. */
export type SerialClass = 'extreme' | 'elite' | 'standard';

/** Cópia que chegou num pack (`cardsPackGranted`): o jogador vem do `cardId` (SQLite local). */
export type PackCard = {
  /** Id da cópia (instância). */
  id: string;
  cardId: number;
  serialNumber: number;
  serialMax: number;
  serialClass: SerialClass;
};

/**
 * `initial` = pacote de boas-vindas (5 cartas), `daily` = pack diário (2 cartas),
 * `found` = carta coletada no mapa (1 carta, mesmo modal com o título "Jogador encontrado!").
 */
export type CardsPackType = 'initial' | 'daily' | 'found';

/** Servidor → jogador depois de andar ~10 m na sala (não logo ao entrar), quando ele tem direito a um pack. */
export type CardsPack = {
  type: CardsPackType;
  cards: PackCard[];
};

/** Dados do próprio jogador na sala: autoritativos no servidor (energia, XP, áreas, km). */
export type CellSelf = {
  fuel: number;
  maxFuel: number;
  xp: number;
  level: number;
  /** Faixa de XP do nível atual (regra de níveis do servidor), para a barra de progresso. */
  levelXpStart: number;
  levelXpEnd: number;
  coverage: number;
  distanceKm: number;
};

/** Motivo de uma compra de energia recusada (do servidor ou do app). */
export type FuelPurchaseError = 'already_full' | 'insufficient_coins' | 'not_connected' | 'timeout' | 'server_error';

/** Motivo de um uso do radar recusado. */
export type RadarError = 'cooldown' | 'no_energy' | 'not_connected' | 'timeout' | 'server_error';

/** Radar recusado: o motivo e, na espera, até quando ela vai. */
export type RadarFailure = { reason: RadarError; cooldownUntil?: number };

/** Radar aceito: as cartas da sala (área res 8) e até quando o radar fica em espera. */
export type RadarResult = { cards: CellCard[]; cooldownUntil: number };

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

/** Dados do jogador enviados ao entrar na sala (o backend prioriza os do banco para fuel/xp/level). */
export type CellRoomProfile = {
  userId: string;
  username: string;
  avatarId: string;
  fuel: number;
  xp: number;
  level: number;
};

export type Position = { lat: number; lng: number };

/** Ganho de moedas para o HUD animar o "+N" (`at` distingue duas coletas de mesmo valor). */
export type CoinGain = {
  value: number;
  at: number;
};

export type UseCellRoomOptions = {
  /** Explore Mode ON: conectado à sala da célula. OFF: fora de qualquer sala (navegação livre). */
  enabled: boolean;
  /** O servidor recusou o movimento (sem energia): o jogador continua em lat/lng. */
  onMoveRejected?: (lat: number, lng: number) => void;
};

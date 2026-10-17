import type {
  CardsPack,
  CellBattery,
  CellCard,
  CellCoin,
  CellSelf,
  CellUser,
  DiscoveryFlag,
  FuelPurchaseError,
  PackCard,
  RadarError,
  SerialClass,
} from './types';

/*
 * Leitura do estado e das mensagens da sala da célula (funções puras, sem React): o servidor manda
 * dados "soltos" e aqui eles viram os tipos do app, com valores padrão e validação.
 */

type MapLike<T> = { forEach: (cb: (item: T, key: string) => void) => void };

function readCollection<T>(state: unknown, key: string): MapLike<any> | undefined {
  return (state as Record<string, MapLike<T> | undefined> | null)?.[key];
}

/** Lista os outros jogadores da sala (sem o próprio usuário, mesmo com sessões duplicadas). */
export function readUsers(state: unknown, selfUserId: string): CellUser[] {
  const list: CellUser[] = [];
  readCollection(state, 'users')?.forEach((user, sessionId) => {
    if (!user || String(user.id) === selfUserId) return;
    list.push({
      sessionId,
      id: String(user.id ?? ''),
      username: String(user.username ?? ''),
      avatar: String(user.avatar ?? ''),
      avatarId: String(user.avatarId ?? ''),
      level: Number(user.level ?? 1),
      lat: Number(user.lat),
      lng: Number(user.lng),
      h3UserCell: String(user.h3UserCell ?? ''),
    });
  });
  return list;
}

/** O próprio jogador na sala (pela sessão); `null` enquanto ele ainda não aparece no estado. */
export function readSelf(state: unknown, sessionId: string): CellSelf | null {
  const users = (state as { users?: { get: (key: string) => any } })?.users;
  const user = users?.get(sessionId);
  if (!user) return null;
  return {
    fuel: Number(user.fuel ?? 0),
    maxFuel: Number(user.maxFuel ?? 100),
    xp: Number(user.xp ?? 0),
    level: Number(user.level ?? 1),
    levelXpStart: Number(user.levelXpStart ?? 0),
    levelXpEnd: Number(user.levelXpEnd ?? 0),
    coverage: Number(user.coverage ?? 0),
    distanceKm: Number(user.distanceKm ?? 0),
  };
}

/** Moedas da sala (`state.coins`): a fonte de verdade — uma moeda coletada sai daqui para todos. */
export function readCoins(state: unknown): CellCoin[] {
  const list: CellCoin[] = [];
  readCollection(state, 'coins')?.forEach((coin, id) => {
    if (!coin) return;
    list.push({
      id: String(coin.id || id),
      lat: Number(coin.lat),
      lng: Number(coin.lng),
      value: Number(coin.value ?? 1),
    });
  });
  return list;
}

/** Baterias da sala (`state.batteries`): somem daqui quando alguém pega (a energia vem no `fuel`). */
export function readBatteries(state: unknown): CellBattery[] {
  const list: CellBattery[] = [];
  readCollection(state, 'batteries')?.forEach((battery, id) => {
    if (!battery) return;
    list.push({ id: String(battery.id || id), lat: Number(battery.lat), lng: Number(battery.lng) });
  });
  return list;
}

/** Cartas no mapa da sala: só id e posição (o jogador da carta não é exposto à interface). */
export function readCards(state: unknown): CellCard[] {
  const list: CellCard[] = [];
  readCollection(state, 'cards')?.forEach((card, id) => {
    if (!card) return;
    const lat = Number(card.lat);
    const lng = Number(card.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    list.push({ id: String(card.id || id), lat, lng });
  });
  return list;
}

/** Preço para encher o tanque (`state.economy`); `null` se não vier um valor válido. */
export function readFillTankPrice(state: unknown): number | null {
  const price = Number((state as { economy?: { fillTankPriceCoins?: number } })?.economy?.fillTankPriceCoins);
  return Number.isFinite(price) && price > 0 ? price : null;
}

/** Dono da bandeira da área: nome, `null` = sem dono, `undefined` = ainda não veio no estado. */
export function readFlagOwner(state: unknown): string | null | undefined {
  const owner = (state as { discoveryFlagOwner?: string })?.discoveryFlagOwner;
  return typeof owner === 'string' ? owner || null : undefined;
}

const SERIAL_CLASSES: SerialClass[] = ['extreme', 'elite', 'standard'];

/**
 * Valida as cartas que chegaram do servidor (`cardsPackGranted`, ou a carta do `roomCardGranted`
 * com `type: 'found'`); `null` se não vier nenhuma carta aproveitável.
 */
export function readCardsPack(message: unknown): CardsPack | null {
  const raw = message as { type?: unknown; cards?: unknown };
  if (!Array.isArray(raw?.cards)) return null;
  const cards: PackCard[] = [];
  for (const item of raw.cards as Record<string, unknown>[]) {
    const cardId = Number(item?.cardId);
    if (!item?.id || !Number.isFinite(cardId)) continue;
    const serialClass = SERIAL_CLASSES.find((value) => value === item.serialClass) ?? 'standard';
    cards.push({
      id: String(item.id),
      cardId,
      serialNumber: Number(item.serialNumber) || 0,
      serialMax: Number(item.serialMax) || 0,
      serialClass,
    });
  }
  if (cards.length === 0) return null;
  const type: CardsPack['type'] = raw.type === 'initial' || raw.type === 'found' ? raw.type : 'daily';
  return { type, cards };
}

const KNOWN_PURCHASE_ERRORS: FuelPurchaseError[] = ['already_full', 'insufficient_coins'];

/** Motivo de uma compra recusada pelo servidor (desconhecido vira `server_error`). */
export function readFuelPurchaseError(reason: unknown): FuelPurchaseError {
  return KNOWN_PURCHASE_ERRORS.find((known) => known === reason) ?? 'server_error';
}

/** Motivo de um radar recusado pelo servidor (desconhecido vira `server_error`). */
export function readRadarError(reason: unknown): RadarError {
  return reason === 'cooldown' || reason === 'no_energy' ? reason : 'server_error';
}

/*
 * Assinaturas: comparam o que mudou de verdade entre dois patches, para não re-renderizar à toa
 * (ex.: o estado muda a cada passo de outro jogador, mas as moedas continuam as mesmas).
 */

export function usersSignature(users: CellUser[]) {
  return users.map((u) => `${u.sessionId}:${u.lat}:${u.lng}:${u.avatar}:${u.username}`).join('|');
}

export function selfSignature(self: CellSelf | null) {
  return self
    ? `${self.fuel}:${self.maxFuel}:${self.xp}:${self.level}:${self.levelXpEnd}:${self.coverage}:${self.distanceKm}`
    : '';
}

/** Moedas e baterias: só o conjunto importa (a posição de cada uma não muda). */
export function idsSignature(items: { id: string }[]) {
  return items.map((item) => item.id).join('|');
}

export function cardsSignature(cards: CellCard[]) {
  return cards.map((card) => `${card.id}:${card.lat}:${card.lng}`).join('|');
}

export function flagsSignature(flags: DiscoveryFlag[]) {
  return flags.map((flag) => flag.h3Index).join('|');
}

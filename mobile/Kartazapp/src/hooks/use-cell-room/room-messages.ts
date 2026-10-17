import type { Room } from '@colyseus/sdk';
import type { QueryClient } from '@tanstack/react-query';

import i18n from '@/i18n';
import type { WalletDto } from '@/lib/api/wallet-api';
import { readCards, readCardsPack, readFuelPurchaseError, readRadarError } from '@/lib/colyseus/cell-state';
import type { RoomRequest } from '@/lib/colyseus/room-request';
import type {
  CardsPack,
  ChangeRoomMessage,
  DiscoveryFlag,
  FuelPurchaseError,
  RadarFailure,
  RadarResult,
  RoomCoinGranted,
} from '@/lib/colyseus/types';
import { handleTradeAccepted, type TradeAcceptedMessage } from '@/lib/notifications/trade-notifications';
import { queryKeys } from '@/lib/query/keys';
import { toast } from '@/lib/toast/toast-store';

import type { CoinGain } from './types';

/** O que as mensagens da sala atualizam no hook. */
export type RoomMessageContext = {
  queryClient: QueryClient;
  /** Esta ainda é a sala atual (mensagens de uma sala antiga, durante a troca, são ignoradas). */
  isCurrent: () => boolean;
  getUserId: () => string | undefined;
  setNearbyCount: (count: number) => void;
  applyFlags: (flags: DiscoveryFlag[]) => void;
  setLastCoinGain: (gain: CoinGain) => void;
  enqueuePack: (pack: CardsPack) => void;
  fuelRequest: RoomRequest<void, FuelPurchaseError>;
  radarRequest: RoomRequest<RadarResult, RadarFailure>;
  /** Sem energia: o servidor não moveu o jogador. */
  onMoveRejected: (lat: number, lng: number) => void;
  /** O jogador cruzou a célula: entrar na nova sala. */
  onChangeRoom: (message: ChangeRoomMessage) => void;
};

/** Saldo novo vindo da sala vai direto para o cache da carteira. */
function setWalletBalance(queryClient: QueryClient, userId: string | undefined, value: unknown) {
  const balance = Number(value);
  if (!Number.isFinite(balance)) return;
  queryClient.setQueryData<WalletDto>(queryKeys.wallet, (wallet) =>
    wallet ? { ...wallet, balance } : { userId: userId ?? '', balance },
  );
}

/** As cópias do jogador mudaram (pack ou carta do mapa): coleção e progresso do catálogo. */
function invalidateCollection(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.userInstances.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.players.all });
}

/** Liga as mensagens que o servidor manda para a sala (o estado em si chega pelo `onStateChange`). */
export function registerRoomMessages(room: Room, ctx: RoomMessageContext) {
  const { queryClient, isCurrent } = ctx;

  // "Perto": o servidor já envia só os OUTROS jogadores distintos (nunca o próprio, nem o
  // "fantasma" dele na sala antiga durante a troca) — o app não ajusta a contagem.
  room.onMessage('nearbyPlayers', (message: { count: number }) => {
    if (!isCurrent()) return;
    ctx.setNearbyCount(Math.max(0, Number(message.count) || 0));
  });

  room.onMessage('discoveryFlags', (message: { flags: DiscoveryFlag[] }) => {
    if (!isCurrent()) return;
    ctx.applyFlags(Array.isArray(message.flags) ? message.flags : []);
  });

  // Radar: responde ao pedido feito nesta sala.
  room.onMessage('radarGranted', (message: { cards?: unknown[]; cooldownUntil?: number }) => {
    const cards = readCards({ cards: message.cards ?? [] });
    ctx.radarRequest.resolve(room, { cards, cooldownUntil: Number(message.cooldownUntil) || Date.now() });
  });

  room.onMessage('radarRejected', (message: { reason?: string; cooldownUntil?: number }) => {
    ctx.radarRequest.reject(room, {
      reason: readRadarError(message.reason),
      cooldownUntil: Number(message.cooldownUntil) || undefined,
    });
  });

  // Compra de energia: responde a quem comprou nesta sala. A energia nova chega pelo estado
  // (`fuel`); o saldo novo vai para o cache da carteira.
  room.onMessage('fuelPurchaseGranted', (message: { balance: number }) => {
    if (!ctx.fuelRequest.isPendingFor(room)) return;
    setWalletBalance(queryClient, ctx.getUserId(), message.balance);
    ctx.fuelRequest.resolve(room, undefined);
  });

  room.onMessage('fuelPurchaseRejected', (message: { reason?: string }) => {
    if (!ctx.fuelRequest.isPendingFor(room)) return;
    ctx.fuelRequest.reject(room, readFuelPurchaseError(message.reason));
    // Saldo pode ter mudado (ex.: moedas insuficientes): confere com o servidor.
    void queryClient.invalidateQueries({ queryKey: queryKeys.wallet });
  });

  // Coletou moedas (passou por cima delas): o saldo novo vai para o cache da carteira e o HUD
  // anima o "+N". A moeda em si some pelo estado da sala (`state.coins`), para todos.
  room.onMessage('roomCoinGranted', (message: RoomCoinGranted) => {
    if (!isCurrent()) return;
    setWalletBalance(queryClient, ctx.getUserId(), message.balance);
    ctx.setLastCoinGain({ value: Math.max(1, Number(message.value) || 1), at: Date.now() });
  });

  // Coletou uma bandeira (foi o primeiro a chegar ao centro da área): avisa e atualiza o perfil.
  room.onMessage('discoveryFlagCollected', (message: { discoveryFlags: number }) => {
    if (!isCurrent()) return;
    toast.reward(
      i18n.t('discoveryFlag.collectedTitle'),
      i18n.t('discoveryFlag.collectedMessage', { count: Number(message.discoveryFlags) || 1 }),
    );
    void queryClient.invalidateQueries({ queryKey: queryKeys.currentUser });
  });

  // Carta do mapa coletada (passou por cima dela): já é do jogador; abre o mesmo modal do pack,
  // com uma carta só. A carta sai do mapa pelo estado da sala (`state.cards`).
  room.onMessage('roomCardGranted', (message: { card?: unknown }) => {
    const pack = readCardsPack({ type: 'found', cards: [message?.card] });
    if (!pack) return;
    ctx.enqueuePack(pack);
    invalidateCollection(queryClient);
  });

  // Pack de cartas (boas-vindas ou diário): as cópias já são do jogador; entra na fila do modal.
  room.onMessage('cardsPackGranted', (message: unknown) => {
    const pack = readCardsPack(message);
    if (!pack) return;
    ctx.enqueuePack(pack);
    invalidateCollection(queryClient);
    // O pacote de boas-vindas cria o time do jogador.
    if (pack.type === 'initial') void queryClient.invalidateQueries({ queryKey: queryKeys.userTeam });
  });

  // Alguém aceitou uma proposta minha (enviada pelo servidor a qualquer sala em que eu esteja).
  room.onMessage('tradeAccepted', (message: TradeAcceptedMessage) => {
    void handleTradeAccepted(ctx.getUserId(), message).catch(() => {});
  });

  room.onMessage('moveRejected', (message: { lat: number; lng: number }) => {
    if (!isCurrent()) return;
    ctx.onMoveRejected(message.lat, message.lng);
  });

  room.onMessage('changeRoom', (message: ChangeRoomMessage) => {
    if (!isCurrent()) return;
    ctx.onChangeRoom(message);
  });

  // Demais mensagens (coinCollected, collectCoinRejected, batteryCollected — a energia nova já
  // vem no estado —, captura de células...) não são usadas no app: o handler genérico evita avisos do SDK.
  room.onMessage('*', () => {});
}

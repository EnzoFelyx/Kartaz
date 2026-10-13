import type { Room } from '@colyseus/sdk';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import i18n from '@/i18n';
import { enterCell } from '@/lib/colyseus/cells';
import type {
  CardsPack,
  CellBattery,
  CellCoin,
  CellUser,
  ChangeRoomMessage,
  DiscoveryFlag,
  JoinCellOptions,
  PackCard,
  RoomCoinGranted,
  SerialClass,
} from '@/lib/colyseus/types';
import { getRoomCell, getUserCell } from '@/lib/h3/cells';
import type { WalletDto } from '@/lib/api/wallet-api';
import { queryKeys } from '@/lib/query/keys';
import { toast } from '@/lib/toast/toast-store';

/** Dados do jogador enviados ao entrar na sala (o backend prioriza os do banco para fuel/xp/level). */
export type CellRoomProfile = {
  userId: string;
  username: string;
  avatarId: string;
  fuel: number;
  xp: number;
  level: number;
};

type Position = { lat: number; lng: number };

/** Dados do próprio jogador na sala — autoritativos no servidor (energia, XP, áreas, km). */
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

type UseCellRoomOptions = {
  /** Explore Mode ON: conectado à sala da célula. OFF: fora de qualquer sala (navegação livre). */
  enabled: boolean;
  /** O servidor recusou o movimento (sem energia): o jogador continua em lat/lng. */
  onMoveRejected?: (lat: number, lng: number) => void;
};

/** Espera entre tentativas de reconexão: 1s, 2s, 4s… até 15s. */
const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 15000;

/** Lista os outros jogadores da sala (sem o próprio usuário, mesmo com sessões duplicadas). */
function readUsers(state: unknown, selfUserId: string): CellUser[] {
  const users = (state as { users?: { forEach: (cb: (user: any, sessionId: string) => void) => void } })?.users;
  const list: CellUser[] = [];
  users?.forEach((user, sessionId) => {
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

/** Moedas da sala (`state.coins`): a fonte de verdade — uma moeda coletada sai daqui para todos. */
function readCoins(state: unknown): CellCoin[] {
  const coins = (state as { coins?: { forEach: (cb: (coin: any, id: string) => void) => void } })?.coins;
  const list: CellCoin[] = [];
  coins?.forEach((coin, id) => {
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
function readBatteries(state: unknown): CellBattery[] {
  const batteries = (state as { batteries?: { forEach: (cb: (battery: any, id: string) => void) => void } })?.batteries;
  const list: CellBattery[] = [];
  batteries?.forEach((battery, id) => {
    if (!battery) return;
    list.push({ id: String(battery.id || id), lat: Number(battery.lat), lng: Number(battery.lng) });
  });
  return list;
}

/** Motivo de uma compra de energia recusada (do servidor ou do app). */
export type FuelPurchaseError = 'already_full' | 'insufficient_coins' | 'not_connected' | 'timeout' | 'server_error';

const FUEL_PURCHASE_TIMEOUT_MS = 10_000;
const KNOWN_PURCHASE_ERRORS: FuelPurchaseError[] = ['already_full', 'insufficient_coins'];

/** Ganho de moedas para o HUD animar o "+N" (`at` distingue duas coletas de mesmo valor). */
export type CoinGain = {
  value: number;
  at: number;
};

const SERIAL_CLASSES: SerialClass[] = ['extreme', 'elite', 'standard'];

/** Valida o `cardsPackGranted` do servidor; `null` se não vier nenhuma carta aproveitável. */
function readCardsPack(message: unknown): CardsPack | null {
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
  return { type: raw.type === 'initial' ? 'initial' : 'daily', cards };
}

function readSelf(state: unknown, sessionId: string): CellSelf | null {
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

function selfSignature(self: CellSelf | null) {
  return self
    ? `${self.fuel}:${self.maxFuel}:${self.xp}:${self.level}:${self.levelXpEnd}:${self.coverage}:${self.distanceKm}`
    : '';
}

/** Assinatura para evitar re-render quando o patch não mudou nada visível (ex.: moedas). */
function usersSignature(users: CellUser[]) {
  return users.map((u) => `${u.sessionId}:${u.lat}:${u.lng}:${u.avatar}:${u.username}`).join('|');
}

/**
 * Sala Colyseus da célula H3 (res 8) do jogador — a única em que o app se conecta. Nela ele
 * vê os outros jogadores e os assets da célula; nada de outras salas chega ao app.
 * - Entrar: `joinCell` se a célula já está ativa (ou em stand-by), `createCell` para ativá-la
 *   (lib/colyseus/cells). O anel de salas vizinhas em stand-by é mantido pelo servidor.
 * - Ao cruzar a célula, o servidor manda `changeRoom`: entra na nova sala e só então
 *   confirma `switchedRoom` na antiga (handoff sem "buraco").
 * - Sai da sala sem sessão, ao desmontar e com o app em segundo plano; volta sozinho depois.
 */
export function useCellRoom(profile: CellRoomProfile | null, { enabled, onMoveRejected }: UseCellRoomOptions) {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);
  const [roomCell, setRoomCell] = useState<string | null>(null);
  const [otherUsers, setOtherUsers] = useState<CellUser[]>([]);
  /** Último estado do jogador vindo da sala (mantido ao sair, até o `GET /user` atualizar). */
  const [self, setSelf] = useState<CellSelf | null>(null);
  /** Outros jogadores por perto (sala + anel k1), contados pelo servidor; `null` fora de sala. */
  const [nearbyCount, setNearbyCount] = useState<number | null>(null);
  /** Bandeira ainda não coletada da sala atual (área res 8) — nunca das vizinhas. */
  const [discoveryFlags, setDiscoveryFlags] = useState<DiscoveryFlag[]>([]);
  /** Dono da bandeira da sala atual: nome de quem coletou, `null` = sem dono, `undefined` = fora de sala. */
  const [flagOwnerName, setFlagOwnerName] = useState<string | null | undefined>(undefined);
  const flagsSignatureRef = useRef('');
  /** Moedas da sala atual (paradas nas coordenadas até alguém coletar). */
  const [coins, setCoins] = useState<CellCoin[]>([]);
  const coinsSignatureRef = useRef('');
  /** Baterias da sala atual (mesmas regras das moedas; recarregam energia). */
  const [batteries, setBatteries] = useState<CellBattery[]>([]);
  const batteriesSignatureRef = useRef('');
  /** Preço fixo para encher o tanque (`state.economy`), mostrado no "Abastecer". */
  const [fillTankPrice, setFillTankPrice] = useState(50);
  /** Compra de energia em andamento: presa à sala em que foi enviada (resposta vem dela). */
  const pendingPurchaseRef = useRef<{
    room: Room;
    resolve: () => void;
    reject: (reason: FuelPurchaseError) => void;
    timer: ReturnType<typeof setTimeout>;
  } | null>(null);
  /** Última coleta de moedas do próprio jogador (para o "+N" do HUD). */
  const [lastCoinGain, setLastCoinGain] = useState<CoinGain | null>(null);
  /**
   * Packs recebidos (boas-vindas / diário) esperando o jogador abrir, em ordem de chegada.
   * Não é limpa na troca de sala: o pack já é do jogador, só falta mostrar.
   */
  const [cardsPacks, setCardsPacks] = useState<CardsPack[]>([]);
  const selfSignatureRef = useRef('');
  const onMoveRejectedRef = useRef(onMoveRejected);

  const roomRef = useRef<Room | null>(null);
  const profileRef = useRef<CellRoomProfile | null>(profile);
  const positionRef = useRef<Position | null>(null);
  const lastSentRef = useRef<Position | null>(null);
  const joiningRef = useRef(false);
  const switchingRef = useRef(false);
  /** Posição recebida durante join/troca: enviada assim que a nova sala estiver pronta. */
  const pendingSendRef = useRef(false);
  /** `true` só com sessão + Explore ON (e app em primeiro plano); `false` não entra nem reconecta. */
  const activeRef = useRef(false);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const signatureRef = useRef('');

  const setRoomUsers = useCallback((users: CellUser[]) => {
    const signature = usersSignature(users);
    if (signature === signatureRef.current) return;
    signatureRef.current = signature;
    setOtherUsers(users);
  }, []);

  const buildJoinOptions = useCallback((position: Position, snapshot?: Partial<CellRoomProfile>) => {
    const current = profileRef.current;
    if (!current) return null;
    const h3UserCell = getUserCell(position.lat, position.lng);
    const options: JoinCellOptions = {
      userId: current.userId,
      username: current.username,
      avatarId: current.avatarId,
      fuel: snapshot?.fuel ?? current.fuel,
      xp: snapshot?.xp ?? current.xp,
      level: snapshot?.level ?? current.level,
      lat: position.lat,
      lng: position.lng,
      h3UserCell,
      h3RoomCell: getRoomCell(h3UserCell),
    };
    return options;
  }, []);

  const sendPosition = useCallback((room: Room) => {
    const position = positionRef.current;
    const current = profileRef.current;
    if (!position || !current) return;
    const last = lastSentRef.current;
    if (last && last.lat === position.lat && last.lng === position.lng) return;
    lastSentRef.current = position;
    // Sem `deltaKm`: período de teste, mover não gasta fuel (o backend só desconta com deltaKm > 0).
    room.send('updatePosition', {
      lat: position.lat,
      lng: position.lng,
      h3UserCell: getUserCell(position.lat, position.lng),
      fuel: current.fuel,
    });
  }, []);

  const resetRoomState = useCallback(() => {
    setConnected(false);
    setRoomCell(null);
    setRoomUsers([]);
    setNearbyCount(null);
    flagsSignatureRef.current = '';
    setDiscoveryFlags([]);
    setFlagOwnerName(undefined);
    coinsSignatureRef.current = '';
    setCoins([]);
    batteriesSignatureRef.current = '';
    setBatteries([]);
  }, [setRoomUsers]);

  // `attachRoom` e `join` se referenciam (reconexão / troca de sala): ligados por ref.
  const joinRef = useRef<(snapshot?: Partial<CellRoomProfile>) => Promise<Room | null>>(async () => null);

  const scheduleReconnect = useCallback(() => {
    if (!activeRef.current || reconnectTimerRef.current) return;
    const delay = Math.min(RECONNECT_BASE_MS * 2 ** reconnectAttemptRef.current, RECONNECT_MAX_MS);
    reconnectAttemptRef.current += 1;
    reconnectTimerRef.current = setTimeout(() => {
      reconnectTimerRef.current = null;
      void joinRef.current();
    }, delay);
  }, []);

  const attachRoom = useCallback(
    (room: Room, h3RoomCell: string) => {
      roomRef.current = room;
      reconnectAttemptRef.current = 0;
      setConnected(true);
      setRoomCell(h3RoomCell);
      // A bandeira é só da sala atual: a da sala anterior some na hora (a nova chega no join).
      // O dono da bandeira não é limpo: o anterior fica na tela até o estado da nova sala chegar.
      flagsSignatureRef.current = '';
      setDiscoveryFlags([]);
      // Moedas e baterias são da sala: a lista da anterior é trocada de uma vez pela da nova.
      coinsSignatureRef.current = '';
      setCoins([]);
      batteriesSignatureRef.current = '';
      setBatteries([]);
      setRoomUsers([]);

      // Patches de uma sala antiga (durante a troca) não podem sobrescrever a lista da nova.
      room.onStateChange((state) => {
        if (roomRef.current !== room) return;
        setRoomUsers(readUsers(state, profileRef.current?.userId ?? ''));
        const nextSelf = readSelf(state, room.sessionId);
        const signature = selfSignature(nextSelf);
        if (nextSelf && signature !== selfSignatureRef.current) {
          selfSignatureRef.current = signature;
          setSelf(nextSelf);
        }
        // Moedas: só re-renderiza quando o conjunto muda (as coordenadas de uma moeda não mudam).
        const nextCoins = readCoins(state);
        const coinsSignature = nextCoins.map((coin) => coin.id).join('|');
        if (coinsSignature !== coinsSignatureRef.current) {
          coinsSignatureRef.current = coinsSignature;
          setCoins(nextCoins);
        }
        const nextBatteries = readBatteries(state);
        const batteriesSignature = nextBatteries.map((battery) => battery.id).join('|');
        if (batteriesSignature !== batteriesSignatureRef.current) {
          batteriesSignatureRef.current = batteriesSignature;
          setBatteries(nextBatteries);
        }
        const price = Number((state as { economy?: { fillTankPriceCoins?: number } })?.economy?.fillTankPriceCoins);
        if (Number.isFinite(price) && price > 0) setFillTankPrice(price);
        // Dono da bandeira da área: vem no estado da sala (chega junto com a entrada). "" = sem dono.
        const owner = (state as { discoveryFlagOwner?: string })?.discoveryFlagOwner;
        if (typeof owner === 'string') setFlagOwnerName(owner || null);
      });

      // "Perto": o servidor já envia só os OUTROS jogadores distintos (nunca o próprio, nem o
      // "fantasma" dele na sala antiga durante a troca) — o app não ajusta a contagem.
      room.onMessage('nearbyPlayers', (message: { count: number }) => {
        if (roomRef.current !== room) return;
        setNearbyCount(Math.max(0, Number(message.count) || 0));
      });

      // Bandeira de descoberta da sala atual (enviada ao entrar e após cada coleta).
      room.onMessage('discoveryFlags', (message: { flags: DiscoveryFlag[] }) => {
        if (roomRef.current !== room) return;
        const flags = Array.isArray(message.flags) ? message.flags : [];
        const signature = flags.map((flag) => flag.h3Index).join('|');
        if (signature === flagsSignatureRef.current) return;
        flagsSignatureRef.current = signature;
        setDiscoveryFlags(flags);
      });

      // Coletou uma bandeira (foi o primeiro a chegar ao centro da área): avisa e atualiza o perfil.
      // Compra de energia: responde a quem comprou nesta sala. A energia nova chega pelo estado
      // (`fuel`); o saldo novo vai para o cache da carteira.
      room.onMessage('fuelPurchaseGranted', (message: { balance: number }) => {
        const pending = pendingPurchaseRef.current;
        if (!pending || pending.room !== room) return;
        const balance = Number(message.balance);
        if (Number.isFinite(balance)) {
          queryClient.setQueryData<WalletDto>(queryKeys.wallet, (wallet) =>
            wallet ? { ...wallet, balance } : { userId: profileRef.current?.userId ?? '', balance },
          );
        }
        clearTimeout(pending.timer);
        pendingPurchaseRef.current = null;
        pending.resolve();
      });
      room.onMessage('fuelPurchaseRejected', (message: { reason?: string }) => {
        const pending = pendingPurchaseRef.current;
        if (!pending || pending.room !== room) return;
        clearTimeout(pending.timer);
        pendingPurchaseRef.current = null;
        const reason = KNOWN_PURCHASE_ERRORS.find((known) => known === message.reason) ?? 'server_error';
        pending.reject(reason);
        // Saldo pode ter mudado (ex.: moedas insuficientes): confere com o servidor.
        void queryClient.invalidateQueries({ queryKey: queryKeys.wallet });
      });

      // Coletou moedas (passou por cima delas): o saldo novo vai para o cache da carteira e o HUD
      // anima o "+N". A moeda em si some pelo estado da sala (`state.coins`), para todos.
      room.onMessage('roomCoinGranted', (message: RoomCoinGranted) => {
        if (roomRef.current !== room) return;
        const balance = Number(message.balance);
        if (Number.isFinite(balance)) {
          queryClient.setQueryData<WalletDto>(queryKeys.wallet, (wallet) =>
            wallet ? { ...wallet, balance } : { userId: profileRef.current?.userId ?? '', balance },
          );
        }
        setLastCoinGain({ value: Math.max(1, Number(message.value) || 1), at: Date.now() });
      });

      room.onMessage('discoveryFlagCollected', (message: { discoveryFlags: number }) => {
        if (roomRef.current !== room) return;
        toast.reward(
          i18n.t('discoveryFlag.collectedTitle'),
          i18n.t('discoveryFlag.collectedMessage', { count: Number(message.discoveryFlags) || 1 }),
        );
        void queryClient.invalidateQueries({ queryKey: queryKeys.currentUser });
      });

      // Pack de cartas (boas-vindas ou diário): as cópias já são do jogador; entra na fila do modal.
      room.onMessage('cardsPackGranted', (message: unknown) => {
        const pack = readCardsPack(message);
        if (!pack) return;
        setCardsPacks((queue) => [...queue, pack]);
        void queryClient.invalidateQueries({ queryKey: queryKeys.userInstances.all });
        void queryClient.invalidateQueries({ queryKey: queryKeys.players.all });
      });

      // Sem energia: o servidor não moveu o jogador; a posição volta para a dele.
      room.onMessage('moveRejected', (message: { lat: number; lng: number }) => {
        if (roomRef.current !== room) return;
        const position = { lat: message.lat, lng: message.lng };
        positionRef.current = position;
        lastSentRef.current = position;
        onMoveRejectedRef.current?.(message.lat, message.lng);
      });

      room.onMessage('changeRoom', async (message: ChangeRoomMessage) => {
        if (roomRef.current !== room || switchingRef.current) return;
        switchingRef.current = true;
        try {
          const next = await joinRef.current({ fuel: message.fuel, xp: message.xp, level: message.level });
          // Só libera a sala antiga depois de estar na nova (o servidor então remove o jogador dela).
          if (next) room.send('switchedRoom', { handoffId: message.handoffId });
        } finally {
          switchingRef.current = false;
        }
      });

      // Demais mensagens (coinCollected, collectCoinRejected, batteryCollected — a energia nova já
      // vem no estado —, cartas do mapa, captura de células...) não são
      // usadas no app: o handler genérico evita avisos do SDK.
      room.onMessage('*', () => {});

      room.onLeave((code) => {
        if (roomRef.current !== room) return; // sala antiga após a troca: esperado
        roomRef.current = null;
        resetRoomState();
        if (activeRef.current) scheduleReconnect();
      });

      if (pendingSendRef.current) {
        pendingSendRef.current = false;
        sendPosition(room);
      }
    },
    [queryClient, resetRoomState, scheduleReconnect, sendPosition, setRoomUsers],
  );

  const join = useCallback(
    async (snapshot?: Partial<CellRoomProfile>) => {
      const position = positionRef.current;
      if (!activeRef.current || !position || !profileRef.current) return null;
      // Na troca de sala o join acontece com a sala antiga ainda ativa (handoff).
      if (joiningRef.current || (roomRef.current && !switchingRef.current)) return null;
      const options = buildJoinOptions(position, snapshot);
      if (!options) return null;

      joiningRef.current = true;
      try {
        const { room } = await enterCell(options);
        if (!activeRef.current) {
          void room.leave();
          return null;
        }
        // A posição enviada no join já está na sala; só reenvia se mudou durante a conexão.
        lastSentRef.current = position;
        attachRoom(room, options.h3RoomCell);
        if (positionRef.current !== position) sendPosition(room);
        return room;
      } catch {
        if (!switchingRef.current) scheduleReconnect();
        return null;
      } finally {
        joiningRef.current = false;
      }
    },
    [attachRoom, buildJoinOptions, scheduleReconnect, sendPosition],
  );

  useEffect(() => {
    joinRef.current = join;
  }, [join]);

  const leave = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    const room = roomRef.current;
    roomRef.current = null;
    if (room) {
      void room.leave();
      // O servidor grava energia/XP/áreas/km ao sair: o GET /user passa a ter os totais.
      void queryClient.invalidateQueries({ queryKey: queryKeys.currentUser });
    }
    resetRoomState();
  }, [queryClient, resetRoomState]);

  /**
   * Só guarda a posição, sem enviar (Explore OFF / posição inicial): ao ligar o Explore, a sala é
   * escolhida por ela e o servidor começa a contar a distância dali — o trajeto "cego" não gasta energia.
   */
  const setPosition = useCallback((lat: number, lng: number) => {
    positionRef.current = { lat, lng };
  }, []);

  /** Nova posição do jogador (centro do mapa): entra na sala se ainda não entrou (só com Explore ON). */
  /**
   * Enche o tanque com moedas (só com a sala conectada, Explore ON) pelo preço fixo da sala. O
   * servidor desconta da carteira e devolve a energia nova no estado. Rejeita com o motivo.
   */
  const purchaseFuel = useCallback(
    () =>
      new Promise<void>((resolve, reject: (reason: FuelPurchaseError) => void) => {
        const room = roomRef.current;
        if (!room || pendingPurchaseRef.current) {
          reject(room ? 'server_error' : 'not_connected');
          return;
        }
        const timer = setTimeout(() => {
          if (pendingPurchaseRef.current?.timer !== timer) return;
          pendingPurchaseRef.current = null;
          reject('timeout');
        }, FUEL_PURCHASE_TIMEOUT_MS);
        pendingPurchaseRef.current = { room, resolve, reject, timer };
        // Chave única por compra: se a mensagem for repetida, o servidor não cobra duas vezes.
        const idempotencyKey = `fuel-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        room.send('purchaseFuel', { idempotencyKey });
      }),
    [],
  );

  const updatePosition = useCallback(
    (lat: number, lng: number) => {
      positionRef.current = { lat, lng };
      if (!activeRef.current) return; // Explore OFF / sem sessão: só guarda a posição
      const room = roomRef.current;
      if (switchingRef.current || joiningRef.current) {
        pendingSendRef.current = true;
        return;
      }
      if (room) sendPosition(room);
      else void join();
    },
    [join, sendPosition],
  );

  // Perfil/sessão: entra quando houver sessão e posição; sai ao perder a sessão (logout).
  const userId = profile?.userId ?? null;
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    onMoveRejectedRef.current = onMoveRejected;
  }, [onMoveRejected]);

  // Conectado só com sessão e Explore ON; Explore OFF sai da sala (navegação livre, sem dados).
  const shouldConnect = !!userId && enabled;
  useEffect(() => {
    if (!shouldConnect) return;
    activeRef.current = true;
    void join();
    return () => {
      activeRef.current = false;
      leave();
    };
  }, [shouldConnect, join, leave]);

  // Segundo plano: sai (não deixa "fantasma" na sala); ao voltar, entra de novo na última posição.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status) => {
      if (!shouldConnect) return;
      if (status === 'active') {
        activeRef.current = true;
        void join();
      } else if (status === 'background') {
        activeRef.current = false;
        leave();
      }
    });
    return () => subscription.remove();
  }, [shouldConnect, join, leave]);

  /** Fecha o pack da vez; o próximo da fila (se houver) aparece em seguida. */
  const dismissCardsPack = useCallback(() => setCardsPacks((queue) => queue.slice(1)), []);

  return {
    connected,
    roomCell,
    otherUsers,
    self,
    nearbyCount,
    discoveryFlags,
    flagOwnerName,
    coins,
    batteries,
    lastCoinGain,
    cardsPack: cardsPacks[0] ?? null,
    dismissCardsPack,
    fillTankPrice,
    purchaseFuel,
    setPosition,
    updatePosition,
  };
}

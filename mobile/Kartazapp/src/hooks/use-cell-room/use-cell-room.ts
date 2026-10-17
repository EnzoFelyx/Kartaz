import type { Room } from '@colyseus/sdk';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { enterCell } from '@/lib/colyseus/cells';
import { RECONNECT_BASE_MS, RECONNECT_MAX_MS, ROOM_REQUEST_TIMEOUT_MS } from '@/lib/colyseus/config';
import { createRoomRequest } from '@/lib/colyseus/room-request';
import type {
  CardsPack,
  ChangeRoomMessage,
  FuelPurchaseError,
  JoinCellOptions,
  RadarFailure,
  RadarResult,
} from '@/lib/colyseus/types';
import { getRoomCell, getUserCell } from '@/lib/h3/cells';
import { queryKeys } from '@/lib/query/keys';

import { registerRoomMessages } from './room-messages';
import type { CellRoomProfile, CoinGain, Position, UseCellRoomOptions } from './types';
import { useRoomState } from './use-room-state';

/**
 * Sala Colyseus da célula H3 (res 8) do jogador — a única em que o app se conecta. Nela ele
 * vê os outros jogadores e os assets da célula; nada de outras salas chega ao app.
 * - Entrar: `joinCell` se a célula já está ativa (ou em stand-by), `createCell` para ativá-la
 *   (lib/colyseus/cells). O anel de salas vizinhas em stand-by é mantido pelo servidor.
 * - Ao cruzar a célula, o servidor manda `changeRoom`: entra na nova sala e só então
 *   confirma `switchedRoom` na antiga (handoff sem "buraco").
 * - Sai da sala sem sessão, ao desmontar e com o app em segundo plano; volta sozinho depois.
 *
 * O que a sala mostra fica em `useRoomState`; as mensagens do servidor, em `room-messages`.
 */
export function useCellRoom(profile: CellRoomProfile | null, { enabled, onMoveRejected }: UseCellRoomOptions) {
  const queryClient = useQueryClient();
  const roomState = useRoomState();
  const [connected, setConnected] = useState(false);
  const [roomCell, setRoomCell] = useState<string | null>(null);
  /** Última coleta de moedas do próprio jogador (para o "+N" do HUD). */
  const [lastCoinGain, setLastCoinGain] = useState<CoinGain | null>(null);
  /**
   * Packs recebidos (boas-vindas / diário / carta do mapa) esperando o jogador abrir, em ordem de
   * chegada. Não é limpa na troca de sala: o pack já é do jogador, só falta mostrar.
   */
  const [cardsPacks, setCardsPacks] = useState<CardsPack[]>([]);

  // Pedidos com resposta (um por vez, presos à sala em que foram enviados).
  const [fuelRequest] = useState(() =>
    createRoomRequest<void, FuelPurchaseError>(
      { notConnected: 'not_connected', busy: 'server_error', timeout: 'timeout' },
      ROOM_REQUEST_TIMEOUT_MS,
    ),
  );
  const [radarRequest] = useState(() =>
    createRoomRequest<RadarResult, RadarFailure>(
      { notConnected: { reason: 'not_connected' }, busy: { reason: 'server_error' }, timeout: { reason: 'timeout' } },
      ROOM_REQUEST_TIMEOUT_MS,
    ),
  );

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

  const { applyState, applyFlags, setNearbyCount, clearRoomAssets, reset } = roomState;

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
    reset();
  }, [reset]);

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

  /** Troca de sala (cruzou a célula): entra na nova e só então libera a antiga. */
  const changeRoom = useCallback(async (room: Room, message: ChangeRoomMessage) => {
    if (switchingRef.current) return;
    switchingRef.current = true;
    try {
      const next = await joinRef.current({ fuel: message.fuel, xp: message.xp, level: message.level });
      // Só libera a sala antiga depois de estar na nova (o servidor então remove o jogador dela).
      if (next) room.send('switchedRoom', { handoffId: message.handoffId });
    } finally {
      switchingRef.current = false;
    }
  }, []);

  const attachRoom = useCallback(
    (room: Room, h3RoomCell: string) => {
      roomRef.current = room;
      reconnectAttemptRef.current = 0;
      setConnected(true);
      setRoomCell(h3RoomCell);
      clearRoomAssets();

      // Patches de uma sala antiga (durante a troca) não podem sobrescrever o estado da nova.
      room.onStateChange((state) => {
        if (roomRef.current !== room) return;
        applyState(state, room.sessionId, profileRef.current?.userId ?? '');
      });

      registerRoomMessages(room, {
        queryClient,
        isCurrent: () => roomRef.current === room,
        getUserId: () => profileRef.current?.userId,
        setNearbyCount,
        applyFlags,
        setLastCoinGain,
        enqueuePack: (pack) => setCardsPacks((queue) => [...queue, pack]),
        fuelRequest,
        radarRequest,
        onMoveRejected: (lat, lng) => {
          const position = { lat, lng };
          positionRef.current = position;
          lastSentRef.current = position;
          onMoveRejectedRef.current?.(lat, lng);
        },
        onChangeRoom: (message) => void changeRoom(room, message),
      });

      room.onLeave(() => {
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
    [
      queryClient,
      applyState,
      applyFlags,
      setNearbyCount,
      clearRoomAssets,
      fuelRequest,
      radarRequest,
      changeRoom,
      resetRoomState,
      scheduleReconnect,
      sendPosition,
    ],
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

  /**
   * Enche o tanque com moedas (só com a sala conectada, Explore ON) pelo preço fixo da sala. O
   * servidor desconta da carteira e devolve a energia nova no estado. Rejeita com o motivo.
   */
  const purchaseFuel = useCallback(
    () =>
      fuelRequest.send(roomRef.current, (room) => {
        // Chave única por compra: se a mensagem for repetida, o servidor não cobra duas vezes.
        const idempotencyKey = `fuel-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        room.send('purchaseFuel', { idempotencyKey });
      }),
    [fuelRequest],
  );

  /** Usa o radar (o servidor cobra a energia e confere a espera) e devolve as cartas da sala. */
  const radarScan = useCallback(
    () => radarRequest.send(roomRef.current, (room) => room.send('radarScan', {})),
    [radarRequest],
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
    otherUsers: roomState.otherUsers,
    self: roomState.self,
    nearbyCount: roomState.nearbyCount,
    discoveryFlags: roomState.discoveryFlags,
    flagOwnerName: roomState.flagOwnerName,
    coins: roomState.coins,
    batteries: roomState.batteries,
    cards: roomState.cards,
    lastCoinGain,
    cardsPack: cardsPacks[0] ?? null,
    dismissCardsPack,
    fillTankPrice: roomState.fillTankPrice,
    purchaseFuel,
    radarScan,
    setPosition,
    updatePosition,
  };
}

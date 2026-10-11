import type { Room } from '@colyseus/sdk';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { enterCell } from '@/lib/colyseus/cells';
import type { CellUser, ChangeRoomMessage, JoinCellOptions } from '@/lib/colyseus/types';
import { getRoomCell, getUserCell } from '@/lib/h3/cells';
import { queryKeys } from '@/lib/query/keys';

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

function readSelf(state: unknown, sessionId: string): CellSelf | null {
  const users = (state as { users?: { get: (key: string) => any } })?.users;
  const user = users?.get(sessionId);
  if (!user) return null;
  return {
    fuel: Number(user.fuel ?? 0),
    maxFuel: Number(user.maxFuel ?? 100),
    xp: Number(user.xp ?? 0),
    level: Number(user.level ?? 1),
    coverage: Number(user.coverage ?? 0),
    distanceKm: Number(user.distanceKm ?? 0),
  };
}

function selfSignature(self: CellSelf | null) {
  return self ? `${self.fuel}:${self.maxFuel}:${self.xp}:${self.level}:${self.coverage}:${self.distanceKm}` : '';
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
      });

      // "Perto": o servidor já envia só os OUTROS jogadores distintos (nunca o próprio, nem o
      // "fantasma" dele na sala antiga durante a troca) — o app não ajusta a contagem.
      room.onMessage('nearbyPlayers', (message: { count: number }) => {
        if (roomRef.current !== room) return;
        setNearbyCount(Math.max(0, Number(message.count) || 0));
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

      // Moedas, cartas, bandeiras, packs etc. ainda não são usados no app: evita avisos do SDK.
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
    [resetRoomState, scheduleReconnect, sendPosition, setRoomUsers],
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

  return { connected, roomCell, otherUsers, self, nearbyCount, setPosition, updatePosition };
}

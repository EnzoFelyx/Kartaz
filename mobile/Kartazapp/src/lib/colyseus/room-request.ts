import type { Room } from '@colyseus/sdk';

/**
 * Pedido à sala que espera uma resposta (comprar energia, radar): um por vez, preso à sala em que foi
 * enviado (a resposta tem que vir dela) e com tempo máximo.
 */
export type RoomRequest<Result, Failure> = {
  /** Envia o pedido; rejeita na hora sem sala ou com outro pedido em andamento. */
  send: (room: Room | null, sendMessage: (room: Room) => void) => Promise<Result>;
  /** Há um pedido em andamento enviado por esta sala (a resposta é para ele). */
  isPendingFor: (room: Room) => boolean;
  resolve: (room: Room, result: Result) => void;
  reject: (room: Room, failure: Failure) => void;
};

type RequestFailures<Failure> = { notConnected: Failure; busy: Failure; timeout: Failure };

export function createRoomRequest<Result, Failure>(
  failures: RequestFailures<Failure>,
  timeoutMs: number,
): RoomRequest<Result, Failure> {
  let pending: {
    room: Room;
    resolve: (result: Result) => void;
    reject: (failure: Failure) => void;
    timer: ReturnType<typeof setTimeout>;
  } | null = null;

  /** Encerra o pedido em andamento desta sala (se houver) e o devolve para responder. */
  const take = (room: Room) => {
    if (!pending || pending.room !== room) return null;
    const current = pending;
    clearTimeout(current.timer);
    pending = null;
    return current;
  };

  return {
    send: (room, sendMessage) =>
      new Promise<Result>((resolve, reject: (failure: Failure) => void) => {
        if (!room || pending) {
          reject(room ? failures.busy : failures.notConnected);
          return;
        }
        const timer = setTimeout(() => {
          if (pending?.timer !== timer) return;
          pending = null;
          reject(failures.timeout);
        }, timeoutMs);
        pending = { room, resolve, reject, timer };
        sendMessage(room);
      }),
    isPendingFor: (room) => pending?.room === room,
    resolve: (room, result) => take(room)?.resolve(result),
    reject: (room, failure) => take(room)?.reject(failure),
  };
}

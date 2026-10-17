/** Espera entre tentativas de reconexão à sala: 1s, 2s, 4s… até 15s. */
export const RECONNECT_BASE_MS = 1000;
export const RECONNECT_MAX_MS = 15000;

/** Tempo máximo esperando a resposta de um pedido à sala (comprar energia, radar). */
export const ROOM_REQUEST_TIMEOUT_MS = 10_000;

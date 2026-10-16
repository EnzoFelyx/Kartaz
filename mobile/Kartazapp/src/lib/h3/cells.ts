// Antes do h3-js: ele cria um TextDecoder("utf-16le") ao carregar, que o RN não suporta.
import '@/shims/text-decoder-utf16';

import { cellToBoundary, cellToParent, latLngToCell } from 'h3-js';

function parseResolution(raw: string | undefined, fallback: number) {
  const value = Number.parseInt(raw ?? '', 10);
  return Number.isInteger(value) && value >= 0 && value <= 15 ? value : fallback;
}

/**
 * Resoluções H3 — precisam ser as mesmas do backend (`H3_RES_USER_CELL` / `H3_RES_ROOM_CELL`).
 * Os hexágonos só mapeiam as salas: não são desenhados no mapa.
 * - Célula do usuário (res 9): onde o jogador está.
 * - Célula da sala (res 8, "pai" da do usuário): quem está nela se vê no mapa (uma sala Colyseus).
 */
export const RES_USER_CELL = parseResolution(process.env.EXPO_PUBLIC_H3_RES_USER_CELL, 9);
export const RES_ROOM_CELL = parseResolution(process.env.EXPO_PUBLIC_H3_RES_ROOM_CELL, 8);

/** Célula do usuário na resolução `RES_USER_CELL`. */
export function getUserCell(lat: number, lng: number) {
  return latLngToCell(lat, lng, RES_USER_CELL);
}

/** Célula da sala: o pai da célula do usuário na resolução `RES_ROOM_CELL`. */
export function getRoomCell(userCell: string) {
  return cellToParent(userCell, RES_ROOM_CELL);
}

/** Vértices do hexágono da sala (res 8) em que está a posição — para enquadrar a sala na câmera. */
export function getRoomBoundary(lat: number, lng: number) {
  const roomCell = getRoomCell(getUserCell(lat, lng));
  return cellToBoundary(roomCell).map(([latitude, longitude]) => ({ latitude, longitude }));
}

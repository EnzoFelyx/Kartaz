import { ErrorCode, type Room } from '@colyseus/sdk';

import { colyseusClient } from './client';
import type { JoinCellOptions } from './types';

/** Nome da sala no backend (`defineRoom(CellRoom).filterBy(["h3RoomCell"])`). */
const CELL_ROOM = 'cell';

export type EnterCellMode = 'join' | 'create';

/**
 * joinCell: entra na sala de uma célula que já está ativa — tem jogadores, e com eles as
 * cartas, moedas e eventos carregados. Falha com `MATCHMAKE_INVALID_CRITERIA` se ninguém
 * ativou a célula ainda.
 */
export function joinCell(options: JoinCellOptions) {
  return colyseusClient.join(CELL_ROOM, options);
}

/**
 * createCell: ativa uma célula sem sala rodando. O servidor cria a sala (`onCreate`), que
 * carrega do banco o que pertence à célula (dono, cartas) e começa a gerar moedas.
 * Usa `joinOrCreate` (atômico no servidor): se outro jogador ativou a mesma célula ao mesmo
 * tempo, entra na sala dele em vez de abrir uma segunda.
 */
export function createCell(options: JoinCellOptions) {
  return colyseusClient.joinOrCreate(CELL_ROOM, options);
}

function isNoRoomError(error: unknown) {
  return (error as { code?: number } | null)?.code === ErrorCode.MATCHMAKE_INVALID_CRITERIA;
}

/** Entra na célula: tenta a sala ativa (joinCell) e, se não houver, ativa a célula (createCell). */
export async function enterCell(options: JoinCellOptions): Promise<{ room: Room; mode: EnterCellMode }> {
  try {
    return { room: await joinCell(options), mode: 'join' };
  } catch (error) {
    if (!isNoRoomError(error)) throw error;
    return { room: await createCell(options), mode: 'create' };
  }
}

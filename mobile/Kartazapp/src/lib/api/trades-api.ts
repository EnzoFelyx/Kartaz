import { ApiError, apiJson, toQueryString } from './client';
import type { UserInstanceDto } from './user-instances-api';

export type TradeStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';

export type TradeUserDto = {
  id: string;
  username: string | null;
};

/** Proposta de troca (`POST/GET /trades`). */
export type TradeProposalDto = {
  id: string;
  status: TradeStatus;
  initiator: TradeUserDto;
  counterparty: TradeUserDto;
  /** Cartas que quem propôs oferece. */
  offerFromInitiator: UserInstanceDto[];
  /** Cartas que quem propôs pede. */
  offerFromCounterparty: UserInstanceDto[];
  createdAt: string;
  updatedAt: string;
};

export type CreateTradeBody = {
  counterpartyId: string;
  /** Cartas do usuário oferecidas (uma ou mais). */
  offerInstanceIds: string[];
  /** Cartas da outra pessoa pedidas. */
  requestInstanceIds: string[];
};

/** Motivos de recusa do backend (`code` no corpo do erro). */
export type TradeErrorCode =
  | 'TRADE_SELF'
  | 'TRADE_EMPTY_SIDE'
  | 'TRADE_DUPLICATE_INSTANCE'
  | 'TRADE_INSTANCE_NOT_OWNED'
  | 'TRADE_INSTANCE_IN_TEAM'
  | 'TRADE_USER_NOT_FOUND'
  | 'TRADE_OWNERSHIP_CHANGED'
  | 'TRADE_NOT_FOUND';

const KNOWN_CODES: TradeErrorCode[] = [
  'TRADE_SELF',
  'TRADE_EMPTY_SIDE',
  'TRADE_DUPLICATE_INSTANCE',
  'TRADE_INSTANCE_NOT_OWNED',
  'TRADE_INSTANCE_IN_TEAM',
  'TRADE_USER_NOT_FOUND',
  'TRADE_OWNERSHIP_CHANGED',
  'TRADE_NOT_FOUND',
];

/** Código do erro de troca vindo do backend (`{ error, code }`), ou `null` se for outro erro. */
export function getTradeErrorCode(error: unknown): TradeErrorCode | null {
  if (!(error instanceof ApiError)) return null;
  return KNOWN_CODES.find((code) => error.message.includes(code)) ?? null;
}

/** POST /trades — cria a proposta (o backend valida posse, titulares e o resto). */
export function createTrade(body: CreateTradeBody) {
  return apiJson<TradeProposalDto>('/trades', {
    method: 'POST',
    auth: 'user',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export type TradesPage = {
  items: TradeProposalDto[];
  total: number;
  take: number;
  skip: number;
};

/** GET /trades — propostas em que o usuário propôs ou recebeu, mais recentes primeiro (até 100). */
export function getTrades(
  params: { status?: TradeStatus; role?: 'all' | 'initiator' | 'counterparty'; take?: number; skip?: number } = {},
) {
  return apiJson<TradesPage>(`/trades${toQueryString({ role: 'all', ...params })}`, { auth: 'user' });
}

/** POST /trades/:id/accept — quem recebeu aceita: as cartas trocam de dono. */
export function acceptTrade(id: string) {
  return apiJson<TradeProposalDto>(`/trades/${id}/accept`, { method: 'POST', auth: 'user' });
}

/** POST /trades/:id/decline — quem recebeu recusa. */
export function declineTrade(id: string) {
  return apiJson<TradeProposalDto>(`/trades/${id}/decline`, { method: 'POST', auth: 'user' });
}

/** DELETE /trades/:id — quem propôs cancela. */
export function cancelTrade(id: string) {
  return apiJson<TradeProposalDto>(`/trades/${id}`, { method: 'DELETE', auth: 'user' });
}

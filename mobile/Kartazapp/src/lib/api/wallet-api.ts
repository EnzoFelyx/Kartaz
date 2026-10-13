import { apiJson } from './client';

/** Carteira de moedas do usuário como devolvida por `GET /wallet`. */
export type WalletDto = {
  userId: string;
  balance: number;
};

/** GET /wallet — saldo de moedas (o backend cria a carteira em 0 se ainda não existir). */
export function getWallet() {
  return apiJson<WalletDto>('/wallet', { auth: 'user' });
}

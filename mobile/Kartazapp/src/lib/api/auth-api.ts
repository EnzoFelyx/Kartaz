import { apiConfig } from './config';

export type GuestSessionResponse = {
  id: string;
  access_token: string;
  refresh_token: string;
  username: string;
  avatarId: number;
  /** Segundos até o access token expirar (30 min). */
  expires_in: number;
};

export type RefreshTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

/** Erro das rotas de auth, com o status HTTP (ex.: 401 = refresh token inválido/expirado). */
export class AuthRequestError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'AuthRequestError';
  }
}

/*
 * Estas duas chamadas usam `fetch` direto (e não `apiFetch`) porque o `apiFetch`
 * depende da sessão para renovar o token: evita a dependência circular.
 */

/** POST /auth/guest — cria um usuário convidado (rota protegida pela chave admin). */
export async function createGuest(): Promise<GuestSessionResponse> {
  const res = await fetch(`${apiConfig.baseUrl}/auth/guest`, {
    method: 'POST',
    headers: { 'x-admin-token': apiConfig.adminKey },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new AuthRequestError(res.status, `POST /auth/guest: ${res.status} ${text || res.statusText}`);
  }
  return res.json() as Promise<GuestSessionResponse>;
}

/** POST /auth/refresh — o backend rotaciona: devolve um refresh token novo a cada uso. */
export async function refreshTokens(refreshToken: string): Promise<RefreshTokenResponse> {
  const res = await fetch(`${apiConfig.baseUrl}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new AuthRequestError(res.status, `POST /auth/refresh: ${res.status} ${text || res.statusText}`);
  }
  return res.json() as Promise<RefreshTokenResponse>;
}

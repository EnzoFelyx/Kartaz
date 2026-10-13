import { Platform } from 'react-native';

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

export type SocialProvider = 'apple' | 'google';

/** Resposta do vínculo social: pode ser outro usuário (se aquela conta Apple/Google já existia). */
export type LinkAccountResponse = {
  user: {
    id: string;
    username: string | null;
    avatarId: number | null;
    email: string | null;
    is_guest: boolean;
  };
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
 * Estas chamadas usam `fetch` direto (e não `apiFetch`) porque o `apiFetch`
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

const LINK_PATHS: Record<SocialProvider, string> = {
  apple: '/auth/link-appleid',
  google: '/auth/link-google',
};

/**
 * POST /auth/link-appleid | /auth/link-google — o backend valida o ID token do provedor e vincula
 * email + provider ao usuário do `accessToken`. 409 = email já usado por outra conta.
 */
export async function linkSocialAccount(
  provider: SocialProvider,
  idToken: string,
  accessToken: string,
): Promise<LinkAccountResponse> {
  const path = LINK_PATHS[provider];
  const res = await fetch(`${apiConfig.baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ token: idToken, platform: Platform.OS }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new AuthRequestError(res.status, `POST ${path}: ${res.status} ${text || res.statusText}`);
  }
  return res.json() as Promise<LinkAccountResponse>;
}

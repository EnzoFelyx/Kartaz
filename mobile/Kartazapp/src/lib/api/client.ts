import { getSession, refreshSession } from '@/lib/auth/session';

import { apiConfig } from './config';

/** Quem autentica a requisição: o usuário (JWT), a chave admin ou ninguém. */
export type ApiAuth = 'user' | 'admin' | 'none';

export type ApiRequestInit = RequestInit & {
  auth?: ApiAuth;
};

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function buildHeaders(init: ApiRequestInit): Headers {
  const headers = new Headers(init.headers);
  if (init.auth === 'admin') {
    headers.set('x-admin-token', apiConfig.adminKey);
  }
  if (init.auth === 'user') {
    const token = getSession()?.accessToken;
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }
  return headers;
}

function request(path: string, init: ApiRequestInit) {
  const url = path.startsWith('http') ? path : `${apiConfig.baseUrl}${path}`;
  return fetch(url, { ...init, headers: buildHeaders(init) });
}

/**
 * `fetch` do backend. Nas rotas de usuário, um 401 (access token expira em 30 min)
 * renova a sessão com o refresh token e repete a requisição uma vez.
 */
export async function apiFetch(path: string, init: ApiRequestInit = {}): Promise<Response> {
  let res = await request(path, init);

  if (res.status === 401 && init.auth === 'user') {
    const refreshed = await refreshSession();
    if (refreshed) res = await request(path, init);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(res.status, `${init.method ?? 'GET'} ${path}: ${res.status} ${text || res.statusText}`);
  }
  return res;
}

/** `apiFetch` + `res.json()`. */
export async function apiJson<T>(path: string, init?: ApiRequestInit): Promise<T> {
  const res = await apiFetch(path, init);
  return res.json() as Promise<T>;
}

/** Monta a query string ignorando valores vazios. */
export function toQueryString(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

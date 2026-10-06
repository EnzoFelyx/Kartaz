import * as SecureStore from 'expo-secure-store';

import { AuthRequestError, createGuest, refreshTokens } from '@/lib/api/auth-api';

const SESSION_KEY = 'kartaz_session';

export type Session = {
  userId: string;
  username: string;
  accessToken: string;
  refreshToken: string;
};

/** Sessão em memória (lida pelo `apiFetch`) e persistida no SecureStore. */
let current: Session | null = null;
let pending: Promise<Session> | null = null;
let refreshing: Promise<boolean> | null = null;

export function getSession() {
  return current;
}

async function saveSession(session: Session) {
  current = session;
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
}

async function loadSession(): Promise<Session | null> {
  const raw = await SecureStore.getItemAsync(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

async function createGuestSession(): Promise<Session> {
  const data = await createGuest();
  const session: Session = {
    userId: data.id,
    username: data.username,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  };
  await saveSession(session);
  return session;
}

/**
 * Garante uma sessão: usa a salva no aparelho ou cria um convidado no backend.
 * Chamadas simultâneas compartilham a mesma promessa.
 */
export function ensureSession(): Promise<Session> {
  if (current) return Promise.resolve(current);
  if (!pending) {
    pending = (async () => {
      const stored = await loadSession();
      if (stored) {
        current = stored;
        return stored;
      }
      return createGuestSession();
    })().finally(() => {
      pending = null;
    });
  }
  return pending;
}

/**
 * Renova o access token com o refresh token (um por vez, mesmo com várias requisições 401).
 * Se o backend recusar o refresh (expira em 30 dias), cria um novo convidado.
 * Retorna `false` se não deu para renovar.
 */
export function refreshSession(): Promise<boolean> {
  if (!refreshing) {
    refreshing = (async () => {
      if (!current) return false;
      try {
        const data = await refreshTokens(current.refreshToken);
        await saveSession({ ...current, accessToken: data.access_token, refreshToken: data.refresh_token });
        return true;
      } catch (error) {
        // Só recria o convidado quando o backend recusou o refresh (expirado/revogado);
        // em erro de rede mantém a sessão atual para tentar de novo depois.
        if (!(error instanceof AuthRequestError) || error.status !== 401) return false;
        try {
          await createGuestSession();
          return true;
        } catch {
          return false;
        }
      }
    })().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

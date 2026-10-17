import * as SecureStore from 'expo-secure-store';

import {
  AuthRequestError,
  createGuest,
  linkSocialAccount,
  refreshTokens,
  type SocialProvider,
} from '@/lib/api/auth-api';
import { storageKeys } from '@/lib/storage/keys';

/** Dados básicos do usuário: iguais para convidado e logado, só muda `isGuest`. */
export type Session = {
  userId: string;
  username: string;
  accessToken: string;
  refreshToken: string;
  avatarId: number;
  /** Segundos até o access token expirar (retornado pelo backend). */
  expiresIn: number;
  /** Convidado ainda não vinculado a uma conta: ao sair, perde o acesso de vez. */
  isGuest: boolean;
};

/** Sessão em memória (lida pelo `apiFetch`) e persistida no SecureStore. */
let current: Session | null = null;
let pending: Promise<Session | null> | null = null;
let refreshing: Promise<boolean> | null = null;

type SessionListener = (session: Session | null) => void;
const listeners = new Set<SessionListener>();

/** Avisa quando a sessão muda fora da UI (ex.: refresh recusado → sessão encerrada). */
export function onSessionChange(listener: SessionListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSession() {
  return current;
}

async function saveSession(session: Session) {
  current = session;
  await SecureStore.setItemAsync(storageKeys.session, JSON.stringify(session));
}

async function loadSession(): Promise<Session | null> {
  const raw = await SecureStore.getItemAsync(storageKeys.session);
  if (!raw) return null;
  try {
    const stored = JSON.parse(raw) as Partial<Session>;
    if (!stored.userId || !stored.accessToken || !stored.refreshToken) return null;
    // Sessões salvas antes destes campos existirem eram todas de convidado.
    return {
      userId: stored.userId,
      username: stored.username ?? '',
      accessToken: stored.accessToken,
      refreshToken: stored.refreshToken,
      avatarId: stored.avatarId ?? 0,
      expiresIn: stored.expiresIn ?? 0,
      isGuest: stored.isGuest ?? true,
    };
  } catch {
    return null;
  }
}

/**
 * Recupera a sessão salva no aparelho (sem criar nenhuma).
 * Chamadas simultâneas compartilham a mesma promessa.
 */
export function restoreSession(): Promise<Session | null> {
  if (current) return Promise.resolve(current);
  if (!pending) {
    pending = loadSession()
      .then((stored) => {
        current = stored;
        return stored;
      })
      .finally(() => {
        pending = null;
      });
  }
  return pending;
}

/** Cria um convidado no backend e salva a sessão no aparelho. */
export async function signInAsGuest(): Promise<Session> {
  const data = await createGuest();
  const session: Session = {
    userId: data.id,
    username: data.username,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    avatarId: data.avatarId,
    expiresIn: data.expires_in,
    isGuest: true,
  };
  await saveSession(session);
  return session;
}

/**
 * Vincula uma conta Apple/Google (só o email; a autenticação continua sendo o JWT do backend).
 * - Com sessão: vincula ao usuário atual (convidado vira conta).
 * - Sem sessão (fim do onboarding): cria um convidado só em memória e vincula a ele; se falhar,
 *   nada fica salvo no aparelho.
 * Se aquela conta já estava vinculada a outro usuário, o backend devolve esse usuário: é o "login".
 */
export async function linkAccount(provider: SocialProvider, idToken: string): Promise<Session> {
  const link = async () => {
    const accessToken = current?.accessToken ?? (await createGuest()).access_token;
    return linkSocialAccount(provider, idToken, accessToken);
  };

  let data;
  try {
    data = await link();
  } catch (error) {
    // Access token da sessão expirado (dura 30 min): renova uma vez e tenta de novo.
    if (!(error instanceof AuthRequestError && error.status === 401 && current && (await refreshSession()))) {
      throw error;
    }
    data = await link();
  }
  const session: Session = {
    userId: data.user.id,
    username: data.user.username ?? '',
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    avatarId: data.user.avatarId ?? 0,
    expiresIn: data.expires_in,
    isGuest: false,
  };
  await saveSession(session);
  return session;
}

/** Apaga a sessão do aparelho. Para um convidado, não há como recuperar a conta depois. */
export async function signOut() {
  current = null;
  await SecureStore.deleteItemAsync(storageKeys.session);
}

/**
 * Renova o access token com o refresh token (um por vez, mesmo com várias requisições 401).
 * Se o backend recusar o refresh (expira em 30 dias), encerra a sessão e avisa os listeners
 * (o app volta para o login). Retorna `false` se não deu para renovar.
 */
export function refreshSession(): Promise<boolean> {
  if (!refreshing) {
    refreshing = (async () => {
      const session = current;
      if (!session) return false;
      try {
        const data = await refreshTokens(session.refreshToken);
        // A sessão mudou durante o refresh (saiu ou entrou outro usuário): descarta os tokens.
        if (current?.userId !== session.userId) return false;
        await saveSession({
          ...session,
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expiresIn: data.expires_in,
        });
        return true;
      } catch (error) {
        // Só encerra quando o backend recusou o refresh (expirado/revogado);
        // em erro de rede mantém a sessão atual para tentar de novo depois.
        if (error instanceof AuthRequestError && error.status === 401 && current?.userId === session.userId) {
          await signOut();
          listeners.forEach((listener) => listener(null));
        }
        return false;
      }
    })().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

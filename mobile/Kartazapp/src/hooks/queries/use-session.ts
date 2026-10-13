import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { linkAccount, restoreSession, signInAsGuest, signOut, type Session } from '@/lib/auth/session';
import { signInWithGoogle } from '@/lib/auth/social-providers';
import { queryKeys } from '@/lib/query/keys';
import { clearUserQueries } from '@/lib/query/query-client';

/**
 * Sessão do usuário salva no aparelho (`null` = ninguém logado → tela de login).
 * As queries da API usam `enabled: isReady` para só rodar com token.
 */
export function useSession() {
  const query = useQuery({
    queryKey: queryKeys.session,
    queryFn: restoreSession,
    staleTime: Infinity,
  });
  return { ...query, isReady: !!query.data };
}

/** Cria um convidado no backend; no sucesso o app sai do login para o jogo. */
export function useSignInAsGuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: signInAsGuest,
    onSuccess: (session) => {
      clearUserQueries(queryClient);
      queryClient.setQueryData<Session | null>(queryKeys.session, session);
    },
  });
}

/**
 * Vincula a conta Google (Apple ainda sem conta paga no Apple Developer): abre o provedor, envia o ID token ao backend e troca a sessão pela
 * devolvida (conta vinculada). Resolve `null` se o usuário cancelar.
 */
export function useLinkAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const idToken = await signInWithGoogle();
      if (!idToken) return null;
      return linkAccount('google', idToken);
    },
    onSuccess: async (session) => {
      if (!session) return;
      queryClient.setQueryData<Session | null>(queryKeys.session, session);
      // Vinculado no Perfil (telas montadas): recarrega os dados — pode ter virado outro usuário.
      await Promise.all(
        [queryKeys.currentUser, queryKeys.userInstances.all, ['playerInstances']].map((queryKey) =>
          queryClient.resetQueries({ queryKey }),
        ),
      );
    },
  });
}

/** Encerra a sessão e descarta os dados do usuário que estavam em cache. */
export function useSignOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      clearUserQueries(queryClient);
      queryClient.setQueryData<Session | null>(queryKeys.session, null);
    },
  });
}

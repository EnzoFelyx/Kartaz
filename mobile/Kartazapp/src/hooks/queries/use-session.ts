import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { restoreSession, signInAsGuest, signOut, type Session } from '@/lib/auth/session';
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

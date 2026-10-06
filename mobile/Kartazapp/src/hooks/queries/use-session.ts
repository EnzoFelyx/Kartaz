import { useQuery } from '@tanstack/react-query';

import { ensureSession } from '@/lib/auth/session';
import { queryKeys } from '@/lib/query/keys';

/**
 * Sessão do usuário (convidado salvo no aparelho ou criado no backend).
 * As queries da API usam `enabled: isReady` para só rodar com token.
 */
export function useSession() {
  const query = useQuery({
    queryKey: queryKeys.session,
    queryFn: ensureSession,
    staleTime: Infinity,
    retry: 2,
  });
  return { ...query, isReady: query.isSuccess };
}

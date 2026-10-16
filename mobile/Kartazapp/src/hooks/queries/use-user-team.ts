import { useQuery } from '@tanstack/react-query';

import { getUserTeam } from '@/lib/api/team-api';
import { queryKeys } from '@/lib/query/keys';

import { useSession } from './use-session';

/**
 * Time do usuário (`GET /user/team`); `data` é `null` enquanto ele não tiver time.
 * Busca de novo sempre que uma tela que usa o time abre: o time nasce com o pacote de boas-vindas
 * (no mapa), e um "sem time" guardado em cache não pode esconder o time recém-criado.
 */
export function useUserTeam() {
  const { isReady } = useSession();
  return useQuery({
    queryKey: queryKeys.userTeam,
    queryFn: getUserTeam,
    enabled: isReady,
    refetchOnMount: 'always',
  });
}

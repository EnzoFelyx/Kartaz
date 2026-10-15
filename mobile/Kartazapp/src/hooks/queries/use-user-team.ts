import { useQuery } from '@tanstack/react-query';

import { getUserTeam } from '@/lib/api/team-api';
import { queryKeys } from '@/lib/query/keys';

import { useSession } from './use-session';

/** Time do usuário (`GET /user/team`); `data` é `null` enquanto ele não tiver time. */
export function useUserTeam() {
  const { isReady } = useSession();
  return useQuery({
    queryKey: queryKeys.userTeam,
    queryFn: getUserTeam,
    enabled: isReady,
  });
}

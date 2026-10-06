import { useQuery } from '@tanstack/react-query';

import { getUniqueNations } from '@/lib/db/playersDb';
import { queryKeys } from '@/lib/query/keys';

/** Seleções existentes na base local (nomes como vêm do backend). */
export function useNations() {
  return useQuery({
    queryKey: queryKeys.players.nations,
    queryFn: async () => getUniqueNations(),
    staleTime: Infinity,
  });
}

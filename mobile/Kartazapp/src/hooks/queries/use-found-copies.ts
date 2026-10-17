import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { getPlayerInstances } from '@/lib/api/player-instances-api';
import { playerInstanceToFoundCopy } from '@/lib/cards/mappers';
import { LIST_PAGE_SIZE } from '@/lib/query/config';
import { queryKeys } from '@/lib/query/keys';

import { useSession } from './use-session';

/** Cópias já encontradas de um jogador (`GET /players/:id/instances`), paginadas. */
export function useFoundCopies(playerId: number) {
  const { isReady } = useSession();

  const result = useInfiniteQuery({
    queryKey: queryKeys.playerInstances.byPlayer(playerId),
    queryFn: async ({ pageParam }) => {
      const page = await getPlayerInstances(playerId, { limit: LIST_PAGE_SIZE, offset: pageParam });
      return { total: page.total, offset: page.offset, copies: page.instances.map(playerInstanceToFoundCopy) };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const next = lastPage.offset + lastPage.copies.length;
      return lastPage.copies.length > 0 && next < lastPage.total ? next : undefined;
    },
    enabled: isReady && Number.isInteger(playerId) && playerId > 0,
  });

  const copies = useMemo(() => result.data?.pages.flatMap((page) => page.copies) ?? [], [result.data]);

  return { ...result, copies };
}

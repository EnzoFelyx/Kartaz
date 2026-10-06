import { useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query/keys';
import { syncCardsProgress } from '@/lib/sync/players-sync';

/** O found/total das cartas pode atrasar até 1 min; o resto da base segue no sync de 6h. */
const PROGRESS_SYNC_INTERVAL_MS = 60 * 1000;

/**
 * Delta sync do found/total das cartas em segundo plano.
 * Só invalida o catálogo quando alguma carta mudou, para as telas relerem do SQLite.
 */
export function useCardsProgressSync(enabled: boolean) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: queryKeys.cardsProgressSync,
    queryFn: async () => {
      const updated = await syncCardsProgress();
      if (updated > 0) {
        console.log('[cardsProgressSync]', { updated });
        await queryClient.invalidateQueries({ queryKey: queryKeys.players.all });
      }
      return updated;
    },
    enabled,
    staleTime: PROGRESS_SYNC_INTERVAL_MS,
    refetchInterval: PROGRESS_SYNC_INTERVAL_MS,
    retry: false,
  });
}

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query/keys';
import { syncPlayersDatabase } from '@/lib/sync/players-sync';

/** Mesmo intervalo do projeto de referência: no máximo um sync a cada 6h. */
const SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000;

/**
 * Sincroniza a base local de jogadores com o backend em segundo plano.
 * O React Query refaz ao abrir o app e ao voltar para ele, respeitando as 6h.
 * Quando algo muda, invalida o catálogo para as telas mostrarem os dados novos.
 */
export function usePlayersSync(enabled: boolean) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: queryKeys.playersSync,
    queryFn: async () => {
      const result = await syncPlayersDatabase();
      if (result.imported > 0) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.players.all });
      }
      return result;
    },
    enabled,
    staleTime: SYNC_INTERVAL_MS,
    refetchInterval: SYNC_INTERVAL_MS,
    retry: false,
  });
}

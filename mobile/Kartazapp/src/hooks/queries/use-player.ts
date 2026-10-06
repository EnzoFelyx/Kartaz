import { useQuery } from '@tanstack/react-query';

import { playerRowToPlayer } from '@/lib/cards/mappers';
import { getPlayerById, getSimilarPlayers } from '@/lib/db/playersDb';
import { queryKeys } from '@/lib/query/keys';

const SIMILAR_LIMIT = 6;

function isValidId(id: number) {
  return Number.isInteger(id) && id > 0;
}

/** Um jogador da base local pelo id (`null` se não existir). */
export function usePlayer(id: number) {
  return useQuery({
    queryKey: queryKeys.players.detail(id),
    queryFn: async () => {
      const row = getPlayerById(id);
      return row ? playerRowToPlayer(row) : null;
    },
    enabled: isValidId(id),
  });
}

/** Jogadores parecidos: mesma posição primeiro, depois o overall mais próximo. */
export function useSimilarPlayers(id: number) {
  return useQuery({
    queryKey: queryKeys.players.similar(id),
    queryFn: async () => {
      const row = getPlayerById(id);
      return row ? getSimilarPlayers(row, SIMILAR_LIMIT).map(playerRowToPlayer) : [];
    },
    enabled: isValidId(id),
  });
}

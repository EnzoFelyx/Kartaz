/**
 * Chaves do React Query num lugar só. Tudo que vem do SQLite fica sob `players`,
 * então `invalidateQueries({ queryKey: queryKeys.players.all })` atualiza o catálogo inteiro.
 */
export const queryKeys = {
  session: ['session'] as const,
  onboardingSeen: ['onboardingSeen'] as const,
  currentUser: ['currentUser'] as const,
  wallet: ['wallet'] as const,
  userTeam: ['userTeam'] as const,
  trades: {
    all: ['trades'] as const,
    list: (status: string) => ['trades', 'list', status] as const,
    count: (status: string) => ['trades', 'count', status] as const,
  },
  playersSync: ['playersSync'] as const,
  cardsProgressSync: ['cardsProgressSync'] as const,

  players: {
    all: ['players'] as const,
    search: (query: string) => ['players', 'search', query] as const,
    nation: (nation: string, query: string) => ['players', 'nation', nation, query] as const,
    nationCount: (nation: string) => ['players', 'nationCount', nation] as const,
    nations: ['players', 'nations'] as const,
    detail: (id: number) => ['players', 'detail', id] as const,
    similar: (id: number) => ['players', 'similar', id] as const,
  },

  userInstances: {
    all: ['userInstances'] as const,
    list: (search: string, filters: object) => ['userInstances', 'list', search, filters] as const,
    count: ['userInstances', 'count'] as const,
    mapFindsCount: ['userInstances', 'mapFindsCount'] as const,
    /** Todas as cartas (várias páginas), ex.: para escolher titulares. */
    everything: ['userInstances', 'everything'] as const,
    byCard: (cardId: number) => ['userInstances', 'byCard', cardId] as const,
  },

  playerInstances: (playerId: number) => ['playerInstances', playerId] as const,
};

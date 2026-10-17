import { focusManager, QueryClient } from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';

import { onSessionChange } from '@/lib/auth/session';

import { DEFAULT_STALE_TIME_MS } from './config';
import { queryKeys } from './keys';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: DEFAULT_STALE_TIME_MS,
      retry: 1,
    },
  },
});

/**
 * Descarta do cache os dados do usuário da sessão (perfil, fuel/xp/level, coleção),
 * para nada de um usuário aparecer para o próximo que entrar no aparelho.
 */
export function clearUserQueries(client: QueryClient = queryClient) {
  client.removeQueries({ queryKey: queryKeys.currentUser });
  client.removeQueries({ queryKey: queryKeys.wallet });
  client.removeQueries({ queryKey: queryKeys.userTeam });
  client.removeQueries({ queryKey: queryKeys.trades.all });
  client.removeQueries({ queryKey: queryKeys.userInstances.all });
  client.removeQueries({ queryKey: queryKeys.playerInstances.all });
}

// Sessão encerrada fora da UI (refresh recusado): limpa os dados e o app volta para o login.
onSessionChange((session) => {
  clearUserQueries();
  queryClient.setQueryData(queryKeys.session, session);
});

/**
 * No React Native não existe "foco da janela": avisa o React Query quando o app
 * volta para o primeiro plano, para refazer as queries desatualizadas.
 */
export function setupQueryFocusManager() {
  if (Platform.OS === 'web') return () => {};
  const subscription = AppState.addEventListener('change', (status) => {
    focusManager.setFocused(status === 'active');
  });
  return () => subscription.remove();
}

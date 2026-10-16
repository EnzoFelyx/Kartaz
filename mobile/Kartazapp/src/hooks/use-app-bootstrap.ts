import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';

import { useCardsProgressSync } from '@/hooks/queries/use-cards-progress-sync';
import { useOnboardingSeen } from '@/hooks/queries/use-onboarding';
import { usePlayersSync } from '@/hooks/queries/use-players-sync';
import { useSession } from '@/hooks/queries/use-session';
import { setupQueryFocusManager } from '@/lib/query/query-client';
import { seedFromBundleIfNeeded } from '@/lib/sync/seedFromBundle';

/**
 * Abertura do app: esconde a splash nativa, liga o foco do React Query ao estado do app e prepara a
 * base local de jogadores. `initializing` fica `true` até a base estar pronta.
 */
export function useAppBootstrap() {
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  useEffect(() => setupQueryFocusManager(), []);

  // Primeira abertura: importa a base de jogadores embutida (assets/data) para o SQLite.
  // Nas próximas aberturas a base local já está em dia e isso retorna na hora (troca se o bundle for mais novo).
  useEffect(() => {
    // Falha no seed não bloqueia o app: o sync com o backend preenche a base depois.
    seedFromBundleIfNeeded()
      .catch(() => {})
      .finally(() => setInitializing(false));
  }, []);

  return { initializing };
}

/**
 * O que a navegação raiz precisa: se há sessão (libera as rotas do jogo) e se ainda está lendo a
 * sessão e a flag do onboarding (que decide em qual slide o login abre).
 */
export function useRootNavigation() {
  const session = useSession();
  const onboardingSeen = useOnboardingSeen();
  return {
    signedIn: session.isReady,
    loading: session.isPending || onboardingSeen.isPending,
  };
}

/**
 * Tarefas de dados em segundo plano, com sessão: sincroniza a base de jogadores (a cada 6h) e o
 * found/total das cartas por delta (a cada 1 min). Não bloqueia a UI: o catálogo funciona offline.
 */
export function useBackgroundSync() {
  const session = useSession();
  usePlayersSync(session.isReady);
  useCardsProgressSync(session.isReady);
}

import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { DatabaseInitSplash } from '@/components/database-init-splash';
import { useCardsProgressSync } from '@/hooks/queries/use-cards-progress-sync';
import { usePlayersSync } from '@/hooks/queries/use-players-sync';
import { useSession } from '@/hooks/queries/use-session';
import '@/i18n';
import { queryClient, setupQueryFocusManager } from '@/lib/query/query-client';
import { seedFromBundleIfNeeded } from '@/lib/sync/seedFromBundle';
import { colors } from '@/theme/colors';

SplashScreen.preventAutoHideAsync();

/**
 * Tarefas de dados em segundo plano, depois da base local pronta e com sessão:
 * sincroniza a base de jogadores (a cada 6h)
 * e o found/total das cartas por delta (a cada 1 min).
 * Não bloqueia a UI: o catálogo funciona offline pelo SQLite.
 */
function BackgroundSync() {
  const session = useSession();
  usePlayersSync(session.isReady);
  useCardsProgressSync(session.isReady);

  return null;
}

/**
 * Rotas do jogo só existem com sessão (convidado ou logado); sem sessão, só o login.
 * Enquanto a sessão é lida do aparelho, o splash continua cobrindo a tela.
 */
function RootNavigator() {
  const session = useSession();
  const signedIn = session.isReady;

  if (session.isPending) return <DatabaseInitSplash />;

  return (
    <>
      {signedIn && <BackgroundSync />}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}>
        <Stack.Screen name="index" />
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="card/[id]" />
          <Stack.Screen name="my-collection" />
          <Stack.Screen name="nation/[code]" />
          <Stack.Screen name="found-copies/[id]" />
        </Stack.Protected>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="login" />
        </Stack.Protected>
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  useEffect(() => setupQueryFocusManager(), []);

  // Primeira abertura: importa a base de jogadores embutida (assets/data) para o SQLite.
  // Nas próximas aberturas a versão local já é > 0 e isso retorna na hora.
  useEffect(() => {
    // Falha no seed não bloqueia o app: o sync com o backend preenche a base depois.
    seedFromBundleIfNeeded()
      .catch(() => {})
      .finally(() => setInitializing(false));
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      {initializing ? <DatabaseInitSplash /> : <RootNavigator />}
    </QueryClientProvider>
  );
}

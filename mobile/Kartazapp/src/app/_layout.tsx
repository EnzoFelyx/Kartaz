import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { DatabaseInitSplash } from '@/components/database-init-splash';
import { usePlayersSync } from '@/hooks/queries/use-players-sync';
import { useSession } from '@/hooks/queries/use-session';
import '@/i18n';
import { apiConfig } from '@/lib/api/config';
import { queryClient, setupQueryFocusManager } from '@/lib/query/query-client';
import { seedFromBundleIfNeeded } from '@/lib/sync/seedFromBundle';
import { colors } from '@/theme/colors';

SplashScreen.preventAutoHideAsync();

/**
 * Tarefas de dados em segundo plano, depois da base local pronta:
 * cria/recupera a sessão no backend e sincroniza a base de jogadores (a cada 6h).
 * Não bloqueia a UI: o catálogo funciona offline pelo SQLite.
 */
function BackgroundSync() {
  const session = useSession();
  usePlayersSync(session.isReady);

  useEffect(() => {
    console.log(`[RootLayout] backend: ${apiConfig.baseUrl}`);
  }, []);

  // Depende só da mensagem: as novas tentativas com o mesmo erro não repetem o log.
  const sessionError = session.error?.message;
  useEffect(() => {
    if (!sessionError) return;
    console.log(
      `[RootLayout] sem sessão com o backend em ${apiConfig.baseUrl} (o backend está rodando?): ${sessionError}`,
    );
  }, [sessionError]);

  return null;
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
    seedFromBundleIfNeeded()
      .then((result) => console.log('[RootLayout] seedFromBundle', result))
      .catch((err) => console.log('[RootLayout] seedFromBundle error', err))
      .finally(() => setInitializing(false));
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      {!initializing && (
        <>
          <BackgroundSync />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
            }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="card/[id]" />
            <Stack.Screen name="my-collection" />
            <Stack.Screen name="nation/[code]" />
            <Stack.Screen name="found-copies/[id]" />
          </Stack>
        </>
      )}
      {initializing && <DatabaseInitSplash />}
    </QueryClientProvider>
  );
}

import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';

import { DatabaseInitSplash } from '@/components/database-init-splash';
import { ToastHost } from '@/components/toast/toast-host';
import { useCardsProgressSync } from '@/hooks/queries/use-cards-progress-sync';
import { useOnboardingSeen } from '@/hooks/queries/use-onboarding';
import { usePlayersSync } from '@/hooks/queries/use-players-sync';
import { useSession } from '@/hooks/queries/use-session';
import '@/i18n';
import { queryClient, setupQueryFocusManager } from '@/lib/query/query-client';
import { seedFromBundleIfNeeded } from '@/lib/sync/seedFromBundle';
import { colors } from '@/theme/colors';

SplashScreen.preventAutoHideAsync();

// Modo estrito do Reanimated desligado: o Skia lê o `.value` dos valores animados que recebe como
// prop sempre que redesenha (brilho do grid do mapa, borda da tab bar, barra de XP), e cada redesenho
// gerava o aviso "Reading from `value` during component render". Os demais avisos continuam.
configureReanimatedLogger({ level: ReanimatedLogLevel.warn, strict: false });

// Fundo da view raiz (aparece por trás das telas durante as transições): o mesmo escuro do app.
SystemUI.setBackgroundColorAsync(colors.background);

/** Tema da navegação com o fundo escuro do app (evita o branco padrão entre as telas). */
const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.background,
  },
};

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
 * Rotas do jogo só existem com sessão (convidado ou logado); sem sessão, o index abre o login (onboarding).
 * Enquanto a sessão é lida do aparelho, o splash continua cobrindo a tela.
 */
function RootNavigator() {
  const session = useSession();
  const onboardingSeen = useOnboardingSeen();
  const signedIn = session.isReady;

  // A flag do onboarding decide em qual slide o login abre: espera ela também.
  if (session.isPending || onboardingSeen.isPending) return <DatabaseInitSplash />;

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
          <Stack.Screen name="edit-profile" />
          <Stack.Screen name="edit-team" />
        </Stack.Protected>
        {/* Onboarding + entrada: só sem sessão. Ao entrar (convidado ou Google), o guard remove a tela e o
            router volta ao index, que leva ao mapa — sem navegação manual disputando com a troca de sessão. */}
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
  // Nas próximas aberturas a base local já está em dia e isso retorna na hora (troca se o bundle for mais novo).
  useEffect(() => {
    // Falha no seed não bloqueia o app: o sync com o backend preenche a base depois.
    seedFromBundleIfNeeded()
      .catch(() => {})
      .finally(() => setInitializing(false));
  }, []);

  return (
    // Raiz dos gestos (react-native-gesture-handler): necessária para os GestureDetector (ex.: toast).
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={navigationTheme}>
          <StatusBar style="light" />
          {initializing ? <DatabaseInitSplash /> : <RootNavigator />}
          {/* Toasts por cima de todas as telas (disparados com `toast.success(...)` etc.). */}
          <ToastHost />
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

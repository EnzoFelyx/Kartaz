import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { DatabaseInitSplash } from '@/components/database-init-splash';
import { ToastHost } from '@/components/toast/toast-host';
import { useAppBootstrap, useBackgroundSync, useRootNavigation } from '@/hooks/use-app-bootstrap';
import '@/i18n';
import { configureApp } from '@/lib/app/configure-app';
import { queryClient } from '@/lib/query/query-client';
import { colors } from '@/theme/colors';

configureApp();

/** Tema da navegação com o fundo escuro do app (evita o branco padrão entre as telas). */
const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.background,
  },
};

/** Sincronizações em segundo plano (só com sessão). */
function BackgroundSync() {
  useBackgroundSync();
  return null;
}

/**
 * Rotas do jogo só existem com sessão (convidado ou logado); sem sessão, o index abre o login (onboarding).
 * Enquanto a sessão é lida do aparelho, o splash continua cobrindo a tela.
 */
function RootNavigator() {
  const { signedIn, loading } = useRootNavigation();

  // A flag do onboarding decide em qual slide o login abre: espera ela também.
  if (loading) return <DatabaseInitSplash />;

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
          <Stack.Screen name="trades/new" />
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
  const { initializing } = useAppBootstrap();

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

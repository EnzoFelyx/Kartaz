import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';

import { configureNotifications } from '@/lib/notifications/trade-notifications';
import { colors } from '@/theme/colors';

/**
 * Configurações globais, uma vez ao carregar o app (antes de qualquer tela): splash presa até o app
 * estar pronto, logger do Reanimated, notificações locais e o fundo da view raiz.
 */
export function configureApp() {
  SplashScreen.preventAutoHideAsync();

  // Modo estrito do Reanimated desligado: o Skia lê o `.value` dos valores animados que recebe como
  // prop sempre que redesenha (brilho do grid do mapa, borda da tab bar, barra de XP), e cada redesenho
  // gerava o aviso "Reading from `value` during component render". Os demais avisos continuam.
  configureReanimatedLogger({ level: ReanimatedLogLevel.warn, strict: false });

  // Notificações locais aparecem também com o app aberto.
  configureNotifications();

  // Fundo da view raiz (aparece por trás das telas durante as transições): o mesmo escuro do app.
  SystemUI.setBackgroundColorAsync(colors.background);
}

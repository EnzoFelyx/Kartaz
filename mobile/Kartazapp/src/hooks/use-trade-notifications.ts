import { useEffect } from 'react';
import { AppState } from 'react-native';

import { checkAcceptedTrades } from '@/lib/notifications/trade-notifications';

import { useSession } from './queries/use-session';

/**
 * Ao abrir o app e sempre que ele volta para a tela: confere se alguma proposta do jogador foi
 * aceita enquanto ele estava fora (e avisa com uma notificação local).
 */
export function useTradeNotifications() {
  const { data: session } = useSession();
  const userId = session?.userId;

  useEffect(() => {
    if (!userId) return;
    const check = () => void checkAcceptedTrades(userId).catch(() => {});
    check();
    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') check();
    });
    return () => subscription.remove();
  }, [userId]);
}

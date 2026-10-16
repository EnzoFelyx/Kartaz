import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';

import i18n from '@/i18n';
import { getTrades } from '@/lib/api/trades-api';
import { queryKeys } from '@/lib/query/keys';
import { queryClient } from '@/lib/query/query-client';

/*
 * Notificações LOCAIS (disparadas pelo próprio app): funcionam com a conta gratuita da Apple.
 * Não adicionar o plugin `expo-notifications` no app.json: ele liga o `aps-environment` (push remoto),
 * que exige a conta paga e quebra o build.
 */

/** Mostra a notificação também com o app aberto (banner + central de notificações). */
export function configureNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/** Pede a permissão de notificação (uma vez; se o usuário negou, o iOS não pergunta de novo). */
export async function ensureNotificationPermission() {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted || !current.canAskAgain) return current.granted;
  return (await Notifications.requestPermissionsAsync()).granted;
}

async function notify(title: string, body: string) {
  const { granted } = await Notifications.getPermissionsAsync();
  if (!granted) return;
  await Notifications.scheduleNotificationAsync({ content: { title, body }, trigger: null });
}

/** Até quando (data de aceite) o jogador já foi avisado — por usuário, para não avisar duas vezes. */
const seenKey = (userId: string) => `tradesAcceptedSeenAt.${userId}`;

async function getSeenAt(userId: string) {
  return SecureStore.getItemAsync(seenKey(userId));
}

async function setSeenAt(userId: string, iso: string) {
  const current = await getSeenAt(userId);
  if (!current || iso > current) await SecureStore.setItemAsync(seenKey(userId), iso);
}

/** As cartas trocaram de dono: coleção, time e trocas mudaram. */
function refreshAfterAccepted() {
  void queryClient.invalidateQueries({ queryKey: queryKeys.trades.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.userInstances.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.userTeam });
  void queryClient.invalidateQueries({ queryKey: queryKeys.players.all });
}

export type TradeAcceptedMessage = {
  tradeId: string;
  byUsername: string | null;
  acceptedAt: string;
};

/** Aviso em tempo real (sala do Colyseus): alguém aceitou uma proposta minha. */
export async function handleTradeAccepted(userId: string | undefined, message: TradeAcceptedMessage) {
  if (!userId) return;
  const seenAt = await getSeenAt(userId);
  if (seenAt && message.acceptedAt <= seenAt) return;
  await setSeenAt(userId, message.acceptedAt);
  refreshAfterAccepted();
  await notify(
    i18n.t('notifications.tradeAcceptedTitle'),
    i18n.t('notifications.tradeAcceptedBody', { name: message.byUsername ?? '—' }),
  );
}

/**
 * Consulta ao abrir / voltar ao app: propostas minhas aceitas depois do último aviso. Na primeira
 * vez (sem registro), só marca o ponto de partida, sem avisar trocas antigas.
 */
export async function checkAcceptedTrades(userId: string | undefined) {
  if (!userId) return;
  const { items } = await getTrades({ status: 'ACCEPTED', role: 'initiator', take: 50 });
  const newest = items.reduce((max, trade) => (trade.updatedAt > max ? trade.updatedAt : max), '');
  const seenAt = await getSeenAt(userId);
  if (!seenAt) {
    await setSeenAt(userId, newest || new Date().toISOString());
    return;
  }

  const fresh = items.filter((trade) => trade.updatedAt > seenAt);
  if (fresh.length === 0) return;
  await setSeenAt(userId, newest);
  refreshAfterAccepted();
  if (fresh.length === 1) {
    await notify(
      i18n.t('notifications.tradeAcceptedTitle'),
      i18n.t('notifications.tradeAcceptedBody', { name: fresh[0].counterparty.username ?? '—' }),
    );
  } else {
    await notify(
      i18n.t('notifications.tradeAcceptedTitle'),
      i18n.t('notifications.tradesAcceptedBody', { count: fresh.length }),
    );
  }
}

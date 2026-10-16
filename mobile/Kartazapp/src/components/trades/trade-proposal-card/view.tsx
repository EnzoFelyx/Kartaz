import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { SwapIcon } from '@/components/icons/swap-icon';
import type { UserInstanceDto } from '@/lib/api/user-instances-api';
import { colors, withAlpha } from '@/theme/colors';
import { formatShortDate } from '@/utils/card-labels';

import { TradeCardTile } from '../trade-card-tile';
import { TRADE_STATUS_COLOR } from '../trade-status-filter';
import type { TradeProposalCardViewModel } from './use-view-model';

/**
 * Enviada por mim: "Você oferece" ⇄ "Você recebe" e, pendente, "Cancelar proposta". Recebida:
 * "Você recebe" vem primeiro e, pendente, "Recusar" / "Aceitar".
 */
export function TradeProposalCardView({
  status,
  createdAt,
  sentByMe,
  otherName,
  iGive,
  iGet,
  pending,
  acceptBlocked,
  busy,
  onAction,
}: TradeProposalCardViewModel) {
  const { t } = useTranslation();
  const statusColor = TRADE_STATUS_COLOR[status];

  const give = <TradeSide label={t('trades.youGive')} cards={iGive} />;
  const get = <TradeSide label={t('trades.youGet')} cards={iGet} />;

  return (
    <View style={[styles.card, { borderColor: withAlpha(statusColor, 0.35) }]}>
      <View style={styles.header}>
        <View style={[styles.statusPill, { backgroundColor: withAlpha(statusColor, 0.15) }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{t(`trades.status.${status}`)}</Text>
        </View>
        <Text style={styles.party} numberOfLines={1}>
          {t(sentByMe ? 'trades.to' : 'trades.from', { name: otherName })}
        </Text>
      </View>
      <Text style={styles.date}>{formatShortDate(createdAt)}</Text>

      {sentByMe ? give : get}
      <View style={styles.swap}>
        <SwapIcon color={colors.primary} size={20} />
      </View>
      {sentByMe ? get : give}

      {pending &&
        (sentByMe ? (
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => onAction('cancel')}
            hitSlop={8}
            style={({ pressed }) => [styles.cancel, (pressed || busy) && styles.dimmed]}>
            <Text style={styles.cancelText}>{t('trades.actions.cancel')}</Text>
          </Pressable>
        ) : (
          <View style={styles.actions}>
            {acceptBlocked && <Text style={styles.blocked}>{t('trades.acceptBlockedStarter')}</Text>}
            <View style={styles.actionRow}>
              <Pressable
                accessibilityRole="button"
                disabled={busy}
                onPress={() => onAction('decline')}
                style={({ pressed }) => [styles.decline, (pressed || busy) && styles.dimmed]}>
                <Text style={styles.declineText}>{t('trades.actions.decline')}</Text>
              </Pressable>
              <View style={styles.flex}>
                <AuthButton
                  label={t('trades.actions.accept')}
                  onPress={() => onAction('accept')}
                  loading={busy}
                  disabled={acceptBlocked}
                />
              </View>
            </View>
          </View>
        ))}
    </View>
  );
}

/** Um lado da troca: rótulo e as cartas (uma ocupa a largura toda; várias, em lista horizontal). */
function TradeSide({ label, cards }: { label: string; cards: UserInstanceDto[] }) {
  return (
    <View style={styles.side}>
      <Text style={styles.sideLabel}>
        {label} · {cards.length}
      </Text>
      {cards.length === 1 ? (
        <TradeCardTile instance={cards[0]} fullWidth />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
          {cards.map((instance) => (
            <TradeCardTile key={instance.id} instance={instance} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 10,
    padding: 16,
    borderRadius: 20,
    backgroundColor: colors.glass,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  party: {
    flexShrink: 1,
    color: colors.secondaryForeground,
    fontSize: 13,
    fontWeight: '600',
  },
  date: {
    marginTop: -4,
    color: colors.mutedForeground,
    fontSize: 12,
  },
  side: {
    gap: 8,
  },
  sideLabel: {
    color: colors.secondaryForeground,
    fontSize: 13,
    fontWeight: '700',
  },
  carousel: {
    gap: 10,
  },
  swap: {
    alignSelf: 'center',
    padding: 6,
    borderRadius: 999,
    backgroundColor: withAlpha(colors.primary, 0.1),
  },
  actions: {
    gap: 10,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  flex: {
    flex: 1,
  },
  decline: {
    flex: 1,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.danger,
  },
  declineText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
  dimmed: {
    opacity: 0.6,
  },
  blocked: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  cancel: {
    alignSelf: 'center',
    marginTop: 4,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelText: {
    color: colors.foreground,
    fontSize: 15,
    fontWeight: '800',
  },
});

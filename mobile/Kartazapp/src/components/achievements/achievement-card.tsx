import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { LockIcon } from '@/components/icons/lock-icon';
import { colors, withAlpha } from '@/theme/colors';
import { formatNumber } from '@/utils/card-labels';

const ICON_BOX_SIZE = 52;

/**
 * Situação da conquista:
 * - `soon`: o modo ainda não existe (ex.: partidas em time) — bloqueada, "Em breve";
 * - `progress`: em andamento, com a barra e o "atual / meta";
 * - `done`: concluída.
 */
export type AchievementStatus = 'soon' | 'progress' | 'done';

type AchievementCardProps = {
  /** Ícone em `colors.secondaryForeground` (o card colore conforme a situação). */
  renderIcon: (color: string) => ReactNode;
  title: string;
  description: string;
  status: AchievementStatus;
  /** Progresso atual e meta (só em `progress`/`done`). */
  current?: number;
  target?: number;
};

/** Uma conquista: ícone (com cadeado se bloqueada), título, descrição, barra de progresso e selo. */
export function AchievementCard({
  renderIcon,
  title,
  description,
  status,
  current = 0,
  target = 1,
}: AchievementCardProps) {
  const { t } = useTranslation();
  const done = status === 'done';
  const soon = status === 'soon';
  const ratio = soon ? 0 : Math.min(Math.max(current / Math.max(target, 1), 0), 1);
  const iconColor = done ? colors.gold : soon ? colors.mutedForeground : colors.primary;

  const badge = soon
    ? t('achievements.soon')
    : done
      ? t('achievements.done')
      : t('achievements.progress', { current: formatNumber(Math.min(current, target)), target: formatNumber(target) });

  return (
    <View
      style={[styles.card, done && styles.cardDone, soon && styles.cardSoon]}
      accessible
      accessibilityLabel={`${title}. ${description}. ${badge}`}>
      <View style={[styles.iconBox, done && styles.iconBoxDone]}>
        {renderIcon(iconColor)}
        {soon && (
          <View style={styles.lockBadge}>
            <LockIcon color={colors.foreground} size={10} />
          </View>
        )}
      </View>

      <View style={styles.body}>
        <Text style={[styles.title, soon && styles.textSoon]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.description, soon && styles.textSoon]}>{description}</Text>

        <View style={styles.track}>
          <View style={[styles.fill, { width: `${ratio * 100}%` }, done && styles.fillDone]} />
        </View>

        <View style={[styles.badge, done && styles.badgeDone]}>
          <Text style={[styles.badgeText, done && styles.badgeTextDone]}>{badge}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 14,
    padding: 16,
    borderRadius: 20,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardDone: {
    borderColor: withAlpha(colors.gold, 0.35),
  },
  cardSoon: {
    opacity: 0.75,
  },
  iconBox: {
    width: ICON_BOX_SIZE,
    height: ICON_BOX_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.secondary,
  },
  iconBoxDone: {
    backgroundColor: withAlpha(colors.gold, 0.14),
  },
  lockBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: colors.background,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '800',
  },
  description: {
    color: colors.secondaryForeground,
    fontSize: 13,
    lineHeight: 18,
  },
  textSoon: {
    color: colors.mutedForeground,
  },
  track: {
    height: 4,
    marginTop: 8,
    overflow: 'hidden',
    borderRadius: 2,
    backgroundColor: colors.track,
  },
  fill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  fillDone: {
    backgroundColor: colors.gold,
  },
  badge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.secondary,
  },
  badgeDone: {
    backgroundColor: withAlpha(colors.gold, 0.16),
  },
  badgeText: {
    color: colors.secondaryForeground,
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextDone: {
    color: colors.gold,
  },
});

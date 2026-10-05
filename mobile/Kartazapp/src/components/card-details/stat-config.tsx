import type { ReactNode } from 'react';

import { ActivityIcon } from '@/components/icons/activity-icon';
import { BoltIcon } from '@/components/icons/bolt-icon';
import { ShareIcon } from '@/components/icons/share-icon';
import { ShieldIcon } from '@/components/icons/shield-icon';
import { StarIcon } from '@/components/icons/star-icon';
import { TargetIcon } from '@/components/icons/target-icon';
import type { PlayerStats } from '@/types/player-card';
import { colors } from '@/theme/colors';

export type StatConfig = {
  key: keyof PlayerStats;
  label: string;
  color: string;
  renderIcon: (size: number) => ReactNode;
};

/** Ordem, nome, cor e ícone de cada atributo — compartilhado entre telas. */
export const STAT_CONFIG: StatConfig[] = [
  { key: 'speed', label: 'Speed', color: colors.gold, renderIcon: (s) => <BoltIcon color={colors.gold} size={s} /> },
  { key: 'shooting', label: 'Shooting', color: colors.danger, renderIcon: (s) => <TargetIcon color={colors.danger} size={s} /> },
  { key: 'passing', label: 'Passing', color: colors.success, renderIcon: (s) => <ShareIcon color={colors.success} size={s} /> },
  { key: 'dribbling', label: 'Dribbling', color: colors.violet, renderIcon: (s) => <StarIcon color={colors.violet} size={s} /> },
  { key: 'defense', label: 'Defense', color: colors.info, renderIcon: (s) => <ShieldIcon color={colors.info} size={s} /> },
  { key: 'physical', label: 'Physical', color: colors.accent, renderIcon: (s) => <ActivityIcon color={colors.accent} size={s} /> },
];

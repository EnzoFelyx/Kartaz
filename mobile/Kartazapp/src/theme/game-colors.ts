import type { TradeStatus } from '@/lib/api/trades-api';
import type { SerialClass } from '@/lib/colyseus/types';
import type { Rarity } from '@/types/player-card';
import type { ZoneDifficulty } from '@/types/zone';

import { colors } from './colors';

/** Cores ligadas às regras do jogo (raridade, classe de série, status de troca, zona). */

/** Cor de cada raridade de carta (protótipo: common/rare/epic/legendary). */
export const rarityColors: Record<Rarity, string> = {
  common: colors.mutedForeground,
  rare: colors.info,
  epic: colors.violet,
  legendary: colors.gold,
};

/** Gradiente da borda das cartas da grade, por raridade. */
export const rarityGradients: Record<Rarity, [string, string]> = {
  legendary: [colors.fuelEnd, colors.gold],
  epic: [colors.violet, colors.magenta],
  rare: [colors.info, colors.violet],
  common: [colors.primary, colors.progressEnd],
};

/** Estilo de cada classe de série: gradiente da borda, cor do selo e brilho em volta ao revelar. */
export const serialClassStyles: Record<SerialClass, { gradient: [string, string]; badge: string; glow: number }> = {
  extreme: {
    gradient: [colors.fuelEnd, colors.gold],
    badge: colors.gold,
    glow: 0.7,
  },
  elite: {
    gradient: [colors.violet, colors.magenta],
    badge: colors.magenta,
    glow: 0.55,
  },
  standard: {
    gradient: [colors.primary, colors.progressEnd],
    badge: colors.fuelEnd,
    glow: 0,
  },
};

/** Cor de cada status de troca: pendente azul, aceita verde, recusada vermelha, cancelada âmbar. */
export const tradeStatusColors: Record<TradeStatus, string> = {
  PENDING: colors.primary,
  ACCEPTED: colors.success,
  DECLINED: colors.danger,
  CANCELLED: colors.fuelEnd,
};

/** Cor da dificuldade da zona no painel do mapa. */
export const zoneDifficultyColors: Record<ZoneDifficulty, string> = {
  low: colors.primary,
  medium: colors.gold,
  high: colors.accent,
};

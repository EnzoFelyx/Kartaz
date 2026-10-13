import type { ReactNode } from 'react';

import { AlertCircleIcon } from '@/components/icons/alert-circle-icon';
import { AlertTriangleIcon } from '@/components/icons/alert-triangle-icon';
import { CheckCircleIcon } from '@/components/icons/check-circle-icon';
import { InfoIcon } from '@/components/icons/info-icon';
import { TrophyIcon } from '@/components/icons/trophy-icon';
import type { ToastVariant } from '@/lib/toast/toast-store';
import { colors } from '@/theme/colors';

type ToastVariantStyle = {
  /** Cor principal: ícone e fundo do selo. */
  color: string;
  /** Gradiente da borda e da barra de timer (uma cor só = sólido). */
  gradient: string[];
  icon: (color: string, size: number) => ReactNode;
};

/** Cores e ícone de cada variante (sucesso, erro, aviso, info, recompensa). */
export const TOAST_VARIANTS: Record<ToastVariant, ToastVariantStyle> = {
  success: {
    color: colors.success,
    gradient: [colors.success, colors.success],
    icon: (color, size) => <CheckCircleIcon color={color} size={size} />,
  },
  error: {
    color: colors.danger,
    gradient: [colors.danger, colors.magenta],
    icon: (color, size) => <AlertCircleIcon color={color} size={size} />,
  },
  warning: {
    color: colors.accent,
    gradient: [colors.accent, colors.fuelEnd],
    icon: (color, size) => <AlertTriangleIcon color={color} size={size} />,
  },
  info: {
    color: colors.info,
    gradient: [colors.primary, colors.info],
    icon: (color, size) => <InfoIcon color={color} size={size} />,
  },
  reward: {
    color: colors.magenta,
    gradient: [colors.violet, colors.magenta, colors.accent],
    icon: (color, size) => <TrophyIcon color={color} size={size} />,
  },
};

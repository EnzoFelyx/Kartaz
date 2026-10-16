import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text } from 'react-native';

import { RadarIcon } from '@/components/icons/radar-icon';
import { colors, withAlpha } from '@/theme/colors';

const BUTTON_SIZE = 56;

type RadarButtonProps = {
  searching: boolean;
  disabled?: boolean;
  /** Segundos de espera até poder usar de novo (`null`/0 = pronto). */
  cooldownSeconds?: number | null;
  onPress: () => void;
};

function formatCooldown(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/** Botão de radar do card da zona: revela as cartas da área. Em espera, mostra o tempo que falta. */
export function RadarButton({ searching, disabled = false, cooldownSeconds, onPress }: RadarButtonProps) {
  const { t } = useTranslation();
  const coolingDown = !!cooldownSeconds && cooldownSeconds > 0;
  const inactive = disabled || searching || coolingDown;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        coolingDown
          ? t('mapDashboard.radarCooldownA11y', { time: formatCooldown(cooldownSeconds) })
          : t('mapDashboard.searchZone')
      }
      accessibilityState={{ disabled: inactive, busy: searching }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [styles.button, inactive && styles.inactive, pressed && styles.pressed]}>
      {coolingDown ? (
        <Text style={styles.cooldown}>{formatCooldown(cooldownSeconds)}</Text>
      ) : (
        <RadarIcon color={colors.primary} size={26} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(colors.primary, 0.12),
    borderWidth: 1,
    borderColor: withAlpha(colors.primary, 0.5),
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  cooldown: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  inactive: {
    opacity: 0.55,
  },
  pressed: {
    transform: [{ scale: 0.95 }],
  },
});

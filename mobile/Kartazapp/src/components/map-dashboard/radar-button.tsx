import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet } from 'react-native';

import { RadarIcon } from '@/components/icons/radar-icon';
import { colors, withAlpha } from '@/theme/colors';

const BUTTON_SIZE = 56;

type RadarButtonProps = {
  searching: boolean;
  disabled?: boolean;
  onPress: () => void;
};

/** Botão de radar do card da zona: dispara a busca na zona atual. */
export function RadarButton({ searching, disabled = false, onPress }: RadarButtonProps) {
  const { t } = useTranslation();
  const inactive = disabled || searching;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('mapDashboard.searchZone')}
      accessibilityState={{ disabled: inactive, busy: searching }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [styles.button, inactive && styles.inactive, pressed && styles.pressed]}>
      <RadarIcon color={colors.primary} size={26} />
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
  inactive: {
    opacity: 0.55,
  },
  pressed: {
    transform: [{ scale: 0.95 }],
  },
});

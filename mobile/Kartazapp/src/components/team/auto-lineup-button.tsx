import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { SparklesIcon } from '@/components/icons/sparkles-icon';
import { colors, withAlpha } from '@/theme/colors';

type AutoLineupButtonProps = {
  disabled: boolean;
  /** Montando a melhor escalação: mostra o carregando no lugar do texto. */
  busy: boolean;
  onPress: () => void;
};

/** "Auto": monta a melhor escalação com as cartas do usuário. */
export function AutoLineupButton({ disabled, busy, onPress }: AutoLineupButtonProps) {
  const { t } = useTranslation();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('team.autoA11y')}
      accessibilityState={{ disabled, busy }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, (pressed || disabled) && styles.pressed]}>
      {busy ? (
        <ActivityIndicator color={colors.primary} size="small" />
      ) : (
        <>
          <SparklesIcon color={colors.primary} size={18} />
          <Text style={styles.text}>{t('team.auto')}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: 84,
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: withAlpha(colors.primary, 0.14),
    borderWidth: 1,
    borderColor: withAlpha(colors.primary, 0.5),
  },
  pressed: {
    opacity: 0.8,
  },
  text: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
});

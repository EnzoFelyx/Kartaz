import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '@/theme/colors';

type AuthButtonVariant = 'primary' | 'secondary' | 'light';

type AuthButtonProps = {
  label: string;
  onPress: () => void;
  /** `light`: fundo branco, para os botões de login social (Apple/Google). */
  variant?: AuthButtonVariant;
  /** Ícone ao lado do texto (logo à esquerda, seta à direita). */
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
};

const TEXT_COLOR: Record<AuthButtonVariant, string> = {
  primary: colors.primaryForeground,
  secondary: colors.foreground,
  light: colors.background,
};

export function AuthButton({
  label,
  onPress,
  variant = 'primary',
  icon,
  iconPosition = 'left',
  loading,
  disabled,
}: AuthButtonProps) {
  const textColor = TEXT_COLOR[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [styles.button, styles[variant], (pressed || disabled) && styles.dimmed]}>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {iconPosition === 'left' && icon}
          <Text style={[styles.label, { color: textColor }]}>{label}</Text>
          {iconPosition === 'right' && icon}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 24,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  light: {
    backgroundColor: colors.white,
  },
  dimmed: {
    opacity: 0.7,
  },
  label: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
});

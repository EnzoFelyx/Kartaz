import { useTranslation } from 'react-i18next';
import { Alert, Platform, StyleSheet, View } from 'react-native';

import { AppleIcon } from '@/components/icons/apple-icon';
import { GoogleIcon } from '@/components/icons/google-icon';
import { useLinkAccount } from '@/hooks/queries/use-session';
import { AuthRequestError } from '@/lib/api/auth-api';
import type { Session } from '@/lib/auth/session';
import { colors } from '@/theme/colors';

import { AuthButton } from './auth-button';

type SocialAuthButtonsProps = {
  /** Chamado depois de vincular (não chama se o usuário cancelar). */
  onLinked?: (session: Session) => void;
  /** Desabilita os botões (ex.: outra ação de entrada em andamento). */
  disabled?: boolean;
};

/** Botões "Continuar com Apple" (só iOS) e "Continuar com Google", que vinculam a conta. */
export function SocialAuthButtons({ onLinked, disabled }: SocialAuthButtonsProps) {
  const { t } = useTranslation();
  const link = useLinkAccount();

  const linkGoogle = () => {
    link.mutate(undefined, {
      onSuccess: (session) => {
        if (session) onLinked?.(session);
      },
      onError: (error) => {
        const emailInUse = error instanceof AuthRequestError && error.status === 409;
        Alert.alert(t('linkAccount.errorTitle'), t(emailInUse ? 'linkAccount.emailInUse' : 'linkAccount.error'));
      },
    });
  };

  const busy = disabled || link.isPending;

  return (
    <View style={styles.container}>
      {Platform.OS === 'ios' && (
        // TODO: Sign in with Apple — só visual até ter a conta paga do Apple Developer
        // (a capability exige o Apple Developer Program; o backend já tem /auth/link-appleid).
        <AuthButton
          label={t('onboarding.continueWithApple')}
          variant="light"
          icon={<AppleIcon color={colors.background} size={20} />}
          onPress={() => {}}
          disabled={busy}
        />
      )}
      <AuthButton
        label={t('onboarding.continueWithGoogle')}
        variant="light"
        icon={<GoogleIcon color={colors.background} size={18} />}
        onPress={linkGoogle}
        loading={link.isPending}
        disabled={busy}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
});

import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, View } from 'react-native';

import { AppleIcon } from '@/components/icons/apple-icon';
import { GoogleIcon } from '@/components/icons/google-icon';
import { colors } from '@/theme/colors';

import { AuthButton } from '../auth-button';
import type { SocialAuthButtonsViewModel } from './use-view-model';

/** Botões "Continuar com Apple" (só iOS) e "Continuar com Google". */
export function SocialAuthButtonsView({ linkGoogle, linking, busy }: SocialAuthButtonsViewModel) {
  const { t } = useTranslation();

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
        loading={linking}
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

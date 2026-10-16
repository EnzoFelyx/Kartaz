import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { useLinkAccount } from '@/hooks/queries/use-session';
import { AuthRequestError } from '@/lib/api/auth-api';
import type { Session } from '@/lib/auth/session';

export type SocialAuthButtonsProps = {
  /** Chamado depois de vincular (não chama se o usuário cancelar). */
  onLinked?: (session: Session) => void;
  /** Desabilita os botões (ex.: outra ação de entrada em andamento). */
  disabled?: boolean;
};

/** Vincular a conta pelo Google (navegador) e o aviso de erro (email já usado por outra conta). */
export function useSocialAuthButtonsViewModel({ onLinked, disabled }: SocialAuthButtonsProps) {
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

  return {
    linkGoogle,
    linking: link.isPending,
    busy: !!disabled || link.isPending,
  };
}

export type SocialAuthButtonsViewModel = ReturnType<typeof useSocialAuthButtonsViewModel>;

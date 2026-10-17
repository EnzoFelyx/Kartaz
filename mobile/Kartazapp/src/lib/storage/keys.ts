/** Chaves do SecureStore num lugar só (mudar uma delas "esquece" o valor salvo no aparelho). */
export const storageKeys = {
  session: 'kartaz_session',
  onboardingSeen: 'kartaz_onboarding_seen',
  /** Última troca aceita já notificada, por usuário. */
  tradesAcceptedSeenAt: (userId: string) => `tradesAcceptedSeenAt.${userId}`,
};

import { useRef, useState } from 'react';

import { useMarkOnboardingSeen, useOnboardingSeen } from '@/hooks/queries/use-onboarding';
import { useSignInAsGuest } from '@/hooks/queries/use-session';

export type SlideId = 'explore' | 'collect' | 'trade' | 'welcome';

export const SLIDES: SlideId[] = ['explore', 'collect', 'trade', 'welcome'];
export const LAST_INDEX = SLIDES.length - 1;

/**
 * Onboarding + entrada: página atual do carrossel (começa na boas-vindas se o onboarding já foi
 * visto), marca como visto ao chegar nela e a entrada como convidado.
 */
export function useLoginViewModel() {
  const guest = useSignInAsGuest();
  const onboardingSeen = useOnboardingSeen();
  const markSeen = useMarkOnboardingSeen();

  // Fixado na montagem: gravar a flag durante o uso não deve mover o carrossel.
  const [initialIndex] = useState(() => (onboardingSeen.data ? LAST_INDEX : 0));
  const [index, setIndex] = useState(initialIndex);
  const markedRef = useRef(false);

  const onPageChange = (page: number) => {
    setIndex(page);
    if (page === LAST_INDEX && !onboardingSeen.data && !markedRef.current) {
      markedRef.current = true;
      markSeen.mutate();
    }
  };

  return {
    initialIndex,
    index,
    onPageChange,
    // Ao entrar, a sessão fica pronta e o guard do layout raiz tira esta tela: o app segue para o mapa.
    playAsGuest: () => guest.mutate(),
    guestPending: guest.isPending,
    guestError: guest.isError,
  };
}

export type LoginViewModel = ReturnType<typeof useLoginViewModel>;

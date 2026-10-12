import { Redirect } from 'expo-router';

import { useOnboardingSeen } from '@/hooks/queries/use-onboarding';
import { useSession } from '@/hooks/queries/use-session';

export default function Index() {
  const { isReady } = useSession();
  const onboardingSeen = useOnboardingSeen();

  // Onboarding ainda não visto: abre nele mesmo com sessão (o último slide leva ao mapa).
  if (!onboardingSeen.data) return <Redirect href="/login" />;
  return <Redirect href={isReady ? '/map' : '/login'} />;
}

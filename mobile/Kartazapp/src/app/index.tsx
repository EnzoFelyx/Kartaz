import { Redirect } from 'expo-router';

import { useSession } from '@/hooks/queries/use-session';

/** Com sessão (convidado ou conta vinculada) vai direto ao jogo; sem sessão, abre o onboarding. */
export default function Index() {
  const { isReady } = useSession();
  return <Redirect href={isReady ? '/map' : '/login'} />;
}

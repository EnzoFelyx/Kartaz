import { Redirect } from 'expo-router';

import { useSession } from '@/hooks/queries/use-session';

export default function Index() {
  const { isReady } = useSession();
  return <Redirect href={isReady ? '/map' : '/login'} />;
}

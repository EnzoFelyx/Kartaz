import { useQuery } from '@tanstack/react-query';

import { getWallet } from '@/lib/api/wallet-api';
import { queryKeys } from '@/lib/query/keys';

import { useSession } from './use-session';

/**
 * Saldo de moedas (`GET /wallet`). Na sala, cada coleta (`roomCoinGranted`) grava o saldo novo
 * neste mesmo cache, então o valor é o mesmo dentro e fora do Explore.
 */
export function useWallet() {
  const { isReady } = useSession();
  return useQuery({
    queryKey: queryKeys.wallet,
    queryFn: getWallet,
    enabled: isReady,
  });
}

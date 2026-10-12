import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getOnboardingSeen, setOnboardingSeen } from '@/lib/onboarding/onboarding-storage';
import { queryKeys } from '@/lib/query/keys';

/** Flag salva no aparelho: `true` = o onboarding abre direto na tela de entrada. */
export function useOnboardingSeen() {
  return useQuery({
    queryKey: queryKeys.onboardingSeen,
    queryFn: getOnboardingSeen,
    staleTime: Infinity,
  });
}

/** Grava que o usuário chegou ao fim do onboarding (próximas aberturas pulam a apresentação). */
export function useMarkOnboardingSeen() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setOnboardingSeen,
    onSuccess: (seen) => queryClient.setQueryData(queryKeys.onboardingSeen, seen),
  });
}

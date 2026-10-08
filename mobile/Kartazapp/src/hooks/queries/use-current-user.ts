import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getCurrentUser, uploadAvatar, type CurrentUserDto } from '@/lib/api/user-api';
import { queryKeys } from '@/lib/query/keys';

import { useSession } from './use-session';

/** Dados do usuário logado vindos do backend (`GET /user`). */
export function useCurrentUser() {
  const { isReady } = useSession();
  return useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: getCurrentUser,
    enabled: isReady,
  });
}

/** Troca a foto de perfil e já atualiza o `GET /user` em cache com a URL nova. */
export function useUploadAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadAvatar,
    onSuccess: ({ avatar }) => {
      queryClient.setQueryData<CurrentUserDto>(queryKeys.currentUser, (user) => (user ? { ...user, avatar } : user));
    },
  });
}

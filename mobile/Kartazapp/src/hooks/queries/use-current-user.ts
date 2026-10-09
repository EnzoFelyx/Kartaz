import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getCurrentUser, uploadAvatar, type CurrentUserDto } from '@/lib/api/user-api';
import { queryKeys } from '@/lib/query/keys';
import { prepareAvatarImage } from '@/utils/avatar-image';

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

/** Reduz e envia a nova foto de perfil; já atualiza o `GET /user` em cache com a URL nova. */
export function useUploadAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    // Reduz para 512px em JPEG antes de enviar (upload rápido e bem abaixo do limite do backend).
    mutationFn: async (image: { uri: string; width: number; height: number }) =>
      uploadAvatar(await prepareAvatarImage(image)),
    onSuccess: ({ avatar }) => {
      queryClient.setQueryData<CurrentUserDto>(queryKeys.currentUser, (user) => (user ? { ...user, avatar } : user));
    },
  });
}

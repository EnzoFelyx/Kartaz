import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { useCurrentUser, useUploadAvatar } from '@/hooks/queries/use-current-user';
import { useSession } from '@/hooks/queries/use-session';
import { resolveApiUri } from '@/lib/api/image-uri';

/**
 * Editar Perfil: troca de foto (real, PUT /user/avatar) e campos de nome, email e bio.
 * Nome/email/bio ainda não são salvos no backend — o salvar só volta para o Perfil.
 */
export function useEditProfileViewModel() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const { data: user } = useCurrentUser();
  const uploadAvatar = useUploadAvatar();

  const realName = user?.username ?? session?.username ?? '';
  const [username, setUsername] = useState(realName);
  const [email, setEmail] = useState(user?.email ?? '');
  const [bio, setBio] = useState(() => t('editProfile.mockBio', { level: user?.level ?? 1 }));

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/profile'));

  // Galeria com recorte quadrado; a foto é reduzida para 512px antes do envio (useUploadAvatar).
  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (result.canceled) return;
    uploadAvatar.mutate(result.assets[0], {
      onError: () => Alert.alert(t('profile.photoErrorTitle'), t('profile.photoErrorMessage')),
    });
  };

  return {
    avatarUri: resolveApiUri(user?.avatar),
    realName,
    uploading: uploadAvatar.isPending,
    pickPhoto,
    username,
    setUsername,
    email,
    setEmail,
    bio,
    setBio,
    goBack,
    // TODO: salvar nome/email/bio no backend (PATCH /user) quando a edição for implementada.
    save: goBack,
  };
}

export type EditProfileViewModel = ReturnType<typeof useEditProfileViewModel>;

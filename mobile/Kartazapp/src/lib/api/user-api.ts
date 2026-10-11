import { File } from 'expo-file-system';

import { apiJson } from './client';

/** Usuário autenticado como devolvido por `GET /user`. */
export type CurrentUserDto = {
  id: string;
  is_guest: boolean;
  username: string | null;
  /** URL relativa da foto de perfil enviada (`/public_assets/user-photos/...`); `null` = foto padrão. */
  avatar: string | null;
  avatarId: number | null;
  email: string | null;
  provider: string | null;
  providerId: string | null;
  level: number;
  xp: number;
  fuel: number;
  coverage: number;
  /** Distância total andada com Explore ON (km). */
  distanceKm: number;
};

/** GET /user — perfil e progresso do usuário da sessão (convidado ou logado). */
export function getCurrentUser() {
  return apiJson<CurrentUserDto>('/user', { auth: 'user' });
}

export type UploadAvatarResponse = {
  avatar: string;
};

/**
 * PUT /user/avatar — envia a foto de perfil (multipart, campo `file`).
 * O `fetch` global do Expo (`expo/fetch`) não aceita o `{ uri, name, type }` do React Native
 * no FormData: a foto vai como `File` do expo-file-system, que ele lê pelos bytes.
 */
export function uploadAvatar(photo: { uri: string }) {
  const body = new FormData();
  body.append('file', new File(photo.uri));
  return apiJson<UploadAvatarResponse>('/user/avatar', { method: 'PUT', body, auth: 'user' });
}

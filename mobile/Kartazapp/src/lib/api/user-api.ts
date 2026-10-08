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
};

/** GET /user — perfil e progresso do usuário da sessão (convidado ou logado). */
export function getCurrentUser() {
  return apiJson<CurrentUserDto>('/user', { auth: 'user' });
}

export type UploadAvatarResponse = {
  avatar: string;
};

/** PUT /user/avatar — envia a foto de perfil (multipart, campo `file`). */
export function uploadAvatar(photo: { uri: string; mimeType?: string | null; fileName?: string | null }) {
  const body = new FormData();
  // No React Native o FormData aceita `{ uri, name, type }` para enviar um arquivo local.
  body.append('file', {
    uri: photo.uri,
    name: photo.fileName ?? 'avatar.jpg',
    type: photo.mimeType ?? 'image/jpeg',
  } as unknown as Blob);
  return apiJson<UploadAvatarResponse>('/user/avatar', { method: 'PUT', body, auth: 'user' });
}

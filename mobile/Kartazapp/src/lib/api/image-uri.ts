import { apiConfig } from './config';

/** URLs do backend podem vir relativas (`/players/photos/1.webp`): completa com o host. */
export function resolveApiUri(uri: string | null | undefined): string | undefined {
  const value = uri?.trim();
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  return `${apiConfig.baseUrl}${value.startsWith('/') ? '' : '/'}${value}`;
}

/** `url` aponta para um arquivo de imagem (e não para uma página web do jogador)? */
function isImageUrl(url: string) {
  return /\.(webp|png|jpe?g|gif|avif)(\?.*)?$/i.test(url);
}

/**
 * Foto do jogador, ou `undefined` (a carta mostra o fundo padrão).
 * - Igual ao projeto de referência: usa o `url` da base, resolvido com o host da API, quando ele é uma
 *   imagem hospedada pelo backend (`/players/photos/<id>.webp`).
 * - Senão, usa o servidor de fotos configurado em `EXPO_PUBLIC_PLAYER_IMAGE_BASE_URL` (`<base>/p<id>.webp`),
 *   se houver um.
 */
export function playerPhotoUri(playerId: number, url?: string | null): string | undefined {
  const value = url?.trim();
  if (value && isImageUrl(value)) return resolveApiUri(value);
  if (!apiConfig.playerImageBaseUrl) return undefined;
  return `${apiConfig.playerImageBaseUrl}/p${playerId}.webp`;
}

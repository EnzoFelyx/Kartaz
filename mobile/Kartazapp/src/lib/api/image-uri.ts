import { apiConfig } from './config';

/** URLs do backend podem vir relativas (`/players/photos/1.webp`): completa com o host. */
export function resolveApiUri(uri: string | null | undefined): string | undefined {
  const value = uri?.trim();
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  return `${apiConfig.baseUrl}${value.startsWith('/') ? '' : '/'}${value}`;
}

/** `url` aponta para um arquivo de imagem (e não para a página do jogador no site da EA)? */
function isImageUrl(url: string) {
  return /\.(webp|png|jpe?g|gif|avif)(\?.*)?$/i.test(url);
}

/**
 * Foto do jogador.
 * - Igual ao projeto de referência: usa o `url` da base, resolvido com o host da API, quando ele é uma
 *   imagem. Isso acontece depois que o backend roda o script de fotos (`/players/photos/<id>.webp`).
 * - Senão (a base embutida traz em `url` o link da página do jogador na EA, que não é imagem),
 *   usa a mesma fonte do script do backend: `<CDN da EA>/p<id>.webp`.
 */
export function playerPhotoUri(playerId: number, url?: string | null) {
  const value = url?.trim();
  if (value && isImageUrl(value)) return resolveApiUri(value)!;
  return `${apiConfig.playerImageBaseUrl}/p${playerId}.webp`;
}

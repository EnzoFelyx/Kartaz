/**
 * O retorno do login do Google pelo navegador (`…:/oauthredirect`) é tratado pelo expo-auth-session:
 * não é uma rota do app. Ignora esse link para o router não abrir uma tela "não encontrada".
 */
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  if (path.includes('oauthredirect')) return null;
  return path;
}

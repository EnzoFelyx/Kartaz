import * as Application from 'expo-application';
import { AuthRequest, exchangeCodeAsync, ResponseType } from 'expo-auth-session';
import { Platform } from 'react-native';

/*
 * Login social só para obter um ID token do provedor (prova do email).
 * O token vai para o backend, que valida e vincula; a autenticação do app continua no JWT próprio.
 */

const GOOGLE_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};

const GOOGLE_CLIENT_ID = Platform.select({
  ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  android: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
});

/** Erro de configuração (client ID ausente): o botão mostra o erro genérico, sem derrubar o app. */
export class SocialConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SocialConfigError';
  }
}

/**
 * Redirect do client nativo do Google:
 * - iOS: esquema do client ID invertido (registrado em `scheme` no app.json).
 * - Android: o package do app (client Android com "Custom URI scheme" habilitado).
 */
function googleRedirectUri(clientId: string) {
  if (Platform.OS === 'ios') {
    const reversed = clientId.split('.').reverse().join('.');
    return `${reversed}:/oauthredirect`;
  }
  return `${Application.applicationId}:/oauthredirect`;
}

/**
 * Google pelo navegador do sistema (ASWebAuthenticationSession / Custom Tabs), com PKCE e sem
 * segredo. Retorna o ID token, ou `null` se o usuário fechar o navegador.
 */
export async function signInWithGoogle(): Promise<string | null> {
  if (!GOOGLE_CLIENT_ID) throw new SocialConfigError('Google client ID não configurado');

  const redirectUri = googleRedirectUri(GOOGLE_CLIENT_ID);
  const request = new AuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    redirectUri,
    scopes: ['openid', 'email', 'profile'],
    responseType: ResponseType.Code,
    usePKCE: true,
    extraParams: { prompt: 'select_account' },
  });

  const result = await request.promptAsync(GOOGLE_DISCOVERY);
  if (result.type !== 'success') {
    if (result.type === 'error') throw result.error ?? new Error('Google sign-in failed');
    return null;
  }

  const tokens = await exchangeCodeAsync(
    {
      clientId: GOOGLE_CLIENT_ID,
      redirectUri,
      code: result.params.code,
      extraParams: { code_verifier: request.codeVerifier ?? '' },
    },
    GOOGLE_DISCOVERY,
  );
  return tokens.idToken ?? null;
}

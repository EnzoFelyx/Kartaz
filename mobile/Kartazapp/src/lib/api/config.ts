import Constants from 'expo-constants';
import { TurboModuleRegistry, type TurboModule } from 'react-native';

/** Endereço do backend definido em `.env.local` (`EXPO_PUBLIC_API_BASE_URL`). */
const CONFIGURED_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

const LOCAL_HOSTS = ['localhost', '127.0.0.1'];

/** Módulo nativo do React Native que sabe de onde o bundle JS foi baixado. */
interface SourceCodeModule extends TurboModule {
  getConstants: () => { scriptURL: string };
}

/**
 * Host do Mac que está rodando o Metro (ex.: "192.168.0.151").
 * - `hostUri`: só existe com expo-dev-client / Expo Go.
 * - `scriptURL`: URL do bundle (ex.: "http://192.168.0.151:8081/index.bundle?..."); funciona no
 *   build de desenvolvimento do `expo run:ios`, que é o caso deste projeto.
 */
function getDevServerHost(): string | undefined {
  const fromHostUri = Constants.expoConfig?.hostUri?.split(':')[0];
  if (fromHostUri) return fromHostUri;
  try {
    const scriptUrl = TurboModuleRegistry.get<SourceCodeModule>('SourceCode')?.getConstants().scriptURL;
    return scriptUrl?.match(/^https?:\/\/([^/:]+)/)?.[1];
  } catch {
    return undefined;
  }
}

/**
 * Em desenvolvimento, `localhost` só funciona no simulador: no iPhone físico ele aponta
 * para o próprio celular. Nesse caso troca pelo IP do Mac que está rodando o Metro,
 * que é o mesmo onde o backend roda.
 */
function resolveApiBaseUrl(configured: string) {
  const url = configured.replace(/\/$/, '');
  if (!__DEV__) return url;

  const devHost = getDevServerHost();
  if (!devHost || LOCAL_HOSTS.includes(devHost)) return url;

  const match = url.match(/^(https?:\/\/)([^/:]+)(.*)$/);
  if (!match || !LOCAL_HOSTS.includes(match[2])) return url;
  return `${match[1]}${devHost}${match[3]}`;
}

/**
 * Token das rotas admin do backend (criar guest, versão/download da base, progresso das cartas).
 * Só para desenvolvimento: tudo que é `EXPO_PUBLIC_*` vai embutido no app.
 */
const ADMIN_API_KEY = process.env.EXPO_PUBLIC_ADMIN_API_KEY ?? '';

/**
 * Servidor de fotos dos jogadores (arquivos `p<id>.webp`), ex.: `http://localhost:3000/players/photos`.
 * Não há valor padrão: o repositório não aponta para nenhuma fonte de imagens de terceiros.
 * Configure só com uma fonte que você tenha direito de usar; sem ela, as cartas mostram o fundo padrão.
 */
const PLAYER_IMAGE_BASE_URL = process.env.EXPO_PUBLIC_PLAYER_IMAGE_BASE_URL?.trim() || undefined;

export const apiConfig = {
  baseUrl: resolveApiBaseUrl(CONFIGURED_API_BASE_URL),
  adminKey: ADMIN_API_KEY,
  // Fotos servidas pelo backend local (`/players/photos`) também precisam do IP do Mac no iPhone físico.
  playerImageBaseUrl: PLAYER_IMAGE_BASE_URL ? resolveApiBaseUrl(PLAYER_IMAGE_BASE_URL) : undefined,
} as const;

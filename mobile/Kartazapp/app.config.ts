import type { ConfigContext, ExpoConfig } from 'expo/config';
import { withInfoPlist, type ConfigPlugin } from 'expo/config-plugins';

// Cores que o app.config precisa ficam em JSON (o config não carrega os .ts do app); o tema lê o mesmo arquivo.
import baseColors from './src/theme/base-colors.json';

/**
 * Registra no Info.plist (só no nativo) o esquema de retorno do login do Google no iOS: o client ID
 * invertido (`com.googleusercontent.apps.<id>`). Fica fora do `scheme` do Expo de propósito: com mais
 * de um esquema lá, o expo-linking avisa "multiple possible URI schemes" a cada abertura.
 */
const withGoogleAuthScheme: ConfigPlugin<string> = (config, scheme) =>
  withInfoPlist(config, (mod) => {
    const urlTypes = mod.modResults.CFBundleURLTypes ?? [];
    const alreadyRegistered = urlTypes.some((type) => type.CFBundleURLSchemes?.includes(scheme));
    if (!alreadyRegistered) {
      mod.modResults.CFBundleURLTypes = [...urlTypes, { CFBundleURLSchemes: [scheme] }];
    }
    return mod;
  });

/**
 * Estende o app.json com configs que dependem de variáveis de ambiente.
 * A chave do Google Maps vem de GOOGLE_MAPS_API_KEY (defina em .env.local, que não vai pro git).
 * O esquema do login do Google vem de EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID; sem ele, nada é registrado.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
  const googleAuthScheme = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.split('.').reverse().join('.');

  const expoConfig: ExpoConfig = {
    ...config,
    name: config.name ?? 'Kartazapp',
    slug: config.slug ?? 'Kartazapp',
    // Fundo da splash e do ícone adaptativo do Android: a cor de fundo do app (do tema).
    android: {
      ...config.android,
      adaptiveIcon: { ...config.android?.adaptiveIcon, backgroundColor: baseColors.background },
    },
    plugins: [
      ...(config.plugins ?? []),
      [
        'expo-splash-screen',
        {
          backgroundColor: baseColors.background,
          image: './assets/images/splash-icon.png',
          imageWidth: 76,
        },
      ],
      [
        'react-native-maps',
        {
          iosGoogleMapsApiKey: googleMapsApiKey,
          androidGoogleMapsApiKey: googleMapsApiKey,
        },
      ],
    ],
  };

  return googleAuthScheme ? withGoogleAuthScheme(expoConfig, googleAuthScheme) : expoConfig;
};

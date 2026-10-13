import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Estende o app.json com configs que dependem de variáveis de ambiente.
 * A chave do Google Maps vem de GOOGLE_MAPS_API_KEY (defina em .env.local, que não vai pro git).
 * O esquema do login do Google no iOS é o client ID invertido (`com.googleusercontent.apps.<id>`),
 * derivado de EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID; sem ele, fica só o esquema do app.json.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
  const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const googleAuthScheme = googleIosClientId?.split('.').reverse().join('.');
  const baseSchemes = [config.scheme ?? []].flat();

  return {
    ...config,
    name: config.name ?? 'Kartazapp',
    slug: config.slug ?? 'Kartazapp',
    scheme: googleAuthScheme ? [...baseSchemes, googleAuthScheme] : baseSchemes,
    plugins: [
      ...(config.plugins ?? []),
      [
        'react-native-maps',
        {
          iosGoogleMapsApiKey: googleMapsApiKey,
          androidGoogleMapsApiKey: googleMapsApiKey,
        },
      ],
    ],
  };
};

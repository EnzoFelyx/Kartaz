import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Estende o app.json com configs que dependem de variáveis de ambiente.
 * A chave do Google Maps vem de GOOGLE_MAPS_API_KEY (defina em .env.local, que não vai pro git).
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;

  return {
    ...config,
    name: config.name ?? 'Kartazapp',
    slug: config.slug ?? 'Kartazapp',
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

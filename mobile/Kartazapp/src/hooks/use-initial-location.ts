import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

export type UserCoordinates = {
  latitude: number;
  longitude: number;
};

type LocationStatus = 'pending' | 'granted' | 'denied';

/**
 * Posição real do aparelho, lida uma vez (permissão "durante o uso"): é o ponto de partida do jogador.
 * Depois disso ele se move arrastando o mapa, então não acompanhamos o GPS.
 * Usa a última posição conhecida (instantânea) e refina com a posição atual.
 */
export function useInitialLocation() {
  const [coords, setCoords] = useState<UserCoordinates | null>(null);
  const [status, setStatus] = useState<LocationStatus>('pending');

  useEffect(() => {
    let cancelled = false;

    const toCoords = (location: Location.LocationObject) => ({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });

    (async () => {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;
      if (permission.status !== 'granted') {
        setStatus('denied');
        return;
      }
      setStatus('granted');

      const lastKnown = await Location.getLastKnownPositionAsync();
      if (cancelled) return;
      if (lastKnown) {
        setCoords(toCoords(lastKnown));
        return;
      }
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (!cancelled) setCoords(toCoords(current));
    })().catch((error) => console.log('[useInitialLocation] sem localização', error));

    return () => {
      cancelled = true;
    };
  }, []);

  return { coords, status };
}

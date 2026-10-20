import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

export type UserCoordinates = {
  latitude: number;
  longitude: number;
};

type LocationStatus = 'pending' | 'granted' | 'denied';

/**
 * Ponto de partida fixo para gravações (EXPO_PUBLIC_DEMO_LOCATION="lat,lng"): substitui o GPS,
 * que nem chega a ser consultado. Sem valor (ou inválido), o app usa a posição real.
 */
function parseDemoLocation(raw: string | undefined): UserCoordinates | null {
  const [latitude, longitude] = (raw ?? '').split(',').map((part) => Number(part.trim()));
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return { latitude, longitude };
}

const DEMO_LOCATION = parseDemoLocation(process.env.EXPO_PUBLIC_DEMO_LOCATION);

/**
 * Posição real do aparelho, lida uma vez (permissão "durante o uso"): é o ponto de partida do jogador.
 * Depois disso ele se move arrastando o mapa, então não acompanhamos o GPS.
 * Usa a última posição conhecida (instantânea) e refina com a posição atual.
 */
export function useInitialLocation() {
  const [coords, setCoords] = useState<UserCoordinates | null>(DEMO_LOCATION);
  const [status, setStatus] = useState<LocationStatus>(DEMO_LOCATION ? 'granted' : 'pending');

  useEffect(() => {
    if (DEMO_LOCATION) return;
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
    })().catch(() => {}); // sem localização: o mapa fica na visão inicial

    return () => {
      cancelled = true;
    };
  }, []);

  return { coords, status };
}

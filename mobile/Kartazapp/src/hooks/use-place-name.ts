import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

import { getRoomCell, getUserCell } from '@/lib/h3/cells';

type Coordinates = { latitude: number; longitude: number };

/**
 * "Cidade - UF" da posição do jogador (geocoder do aparelho, via expo-location).
 * Só consulta quando `enabled` (Explore ON) e a célula res 8 muda — o geocoder do iOS tem limite
 * de requisições. Mantém o último nome enquanto não houver um novo.
 */
export function usePlaceName(position: Coordinates | null, enabled: boolean) {
  const [placeName, setPlaceName] = useState<string | null>(null);
  const roomCell = position && enabled ? getRoomCell(getUserCell(position.latitude, position.longitude)) : null;

  useEffect(() => {
    if (!roomCell || !position) return;
    let cancelled = false;
    Location.reverseGeocodeAsync({ latitude: position.latitude, longitude: position.longitude })
      .then(([place]) => {
        if (cancelled || !place) return;
        const city = place.city ?? place.subregion ?? place.district;
        const region = place.region;
        const name = [city, region].filter(Boolean).join(' - ');
        if (name) setPlaceName(name);
      })
      .catch(() => {}); // geocoder indisponível: mantém o último nome
    return () => {
      cancelled = true;
    };
    // Só a troca de célula dispara uma nova consulta (a posição exata dentro dela não importa).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCell]);

  return placeName;
}

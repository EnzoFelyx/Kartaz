import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Marker } from 'react-native-maps';

import { MapCardIcon, mapCardIconSize } from '@/components/icons/map-card-icon';
import type { CellCard } from '@/lib/colyseus/types';

/** Ângulo máximo do balanço (graus). */
const SHAKE_DEG = 12;
/** Duração de um chacoalhão. */
const SHAKE_MS = 420;
/** Quantas idas e vindas cabem num chacoalhão. */
const SHAKE_CYCLES = 2.5;
/** Intervalo entre um balanço e outro enquanto a carta espera no mapa. */
const SHAKE_EVERY_MS = 4000;

type MapCardMarkerProps = {
  card: CellCard;
  /** Altura da carta; a largura sai da proporção. */
  height: number;
  accessibilityLabel: string;
};

/**
 * Carta virada para baixo no mapa. Chacoalha de leve ao aparecer e repete um chacoalhão curto de
 * tempos em tempos, chamando atenção sem ficar se mexendo o tempo todo.
 * O mapa desenha o marcador como imagem e só a atualiza quando o React redesenha o SVG; por isso o
 * ângulo é estado (um quadro por frame só durante o chacoalhão), não animação do Reanimated, e o
 * giro é feito dentro do SVG (`MapCardIcon`) — girar a view fazia a carta sumir.
 */
export function MapCardMarker({ card, height, accessibilityLabel }: MapCardMarkerProps) {
  const [rotation, setRotation] = useState(0);
  const size = mapCardIconSize(height);

  useEffect(() => {
    let frame = 0;

    const shake = () => {
      cancelAnimationFrame(frame);
      const start = Date.now();
      const tick = () => {
        const t = Math.min((Date.now() - start) / SHAKE_MS, 1);
        // Seno amortecido: começa forte e vai parando no zero.
        setRotation(t >= 1 ? 0 : SHAKE_DEG * Math.sin(t * SHAKE_CYCLES * 2 * Math.PI) * (1 - t));
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };

    shake();
    const interval = setInterval(shake, SHAKE_EVERY_MS);
    return () => {
      clearInterval(interval);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <Marker
      coordinate={{ latitude: card.lat, longitude: card.lng }}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges
      zIndex={1}
      accessibilityLabel={accessibilityLabel}>
      <View style={size} collapsable={false}>
        <MapCardIcon height={height} rotation={rotation} />
      </View>
    </Marker>
  );
}

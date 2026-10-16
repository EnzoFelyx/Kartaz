import type { RefObject } from 'react';

import type { RadarResult } from '@/hooks/use-cell-room';

/**
 * Ações da sala que a câmera e o radar usam. A sala só conecta depois de saber se o Explore está
 * ligado (que depende da câmera e do radar), então essas ações chegam por uma ref preenchida pelo
 * view model depois que a sala existe.
 */
export type MapRoomActions = {
  /** Anda (Explore ON): manda a posição para a sala, que cobra energia. */
  updatePosition: (lat: number, lng: number) => void;
  /** Só guarda a posição (Explore OFF: navegação livre). */
  setPosition: (lat: number, lng: number) => void;
  radarScan: () => Promise<RadarResult>;
  /** Sem energia: com o Explore ligado, o jogador não anda. */
  outOfEnergy: boolean;
};

export type MapRoomActionsRef = RefObject<MapRoomActions>;

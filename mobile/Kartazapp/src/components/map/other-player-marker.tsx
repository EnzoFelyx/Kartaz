import { useState } from 'react';
import { Marker } from 'react-native-maps';

import { resolveApiUri } from '@/lib/api/image-uri';
import type { CellUser } from '@/lib/colyseus/types';

import { MapAvatar } from './map-avatar';

const OTHER_PLAYER_AVATAR_SIZE = 40;

type OtherPlayerMarkerProps = {
  player: CellUser;
  accessibilityLabel: string;
};

/** Outro jogador da mesma célula H3: a foto dele na posição que veio da sala. */
export function OtherPlayerMarker({ player, accessibilityLabel }: OtherPlayerMarkerProps) {
  const uri = resolveApiUri(player.avatar);
  // O mapa desenha o marcador como imagem: redesenha até a foto carregar e depois congela.
  const [readyUri, setReadyUri] = useState<string | undefined>(undefined);
  const tracksViewChanges = !!uri && readyUri !== uri;

  return (
    <Marker
      coordinate={{ latitude: player.lat, longitude: player.lng }}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={tracksViewChanges}
      zIndex={2}
      accessibilityLabel={accessibilityLabel}>
      <MapAvatar uri={uri} size={OTHER_PLAYER_AVATAR_SIZE} onReady={() => setReadyUri(uri)} />
    </Marker>
  );
}

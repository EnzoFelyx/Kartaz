import { useState } from 'react';
import { Marker } from 'react-native-maps';

import { resolveApiUri } from '@/lib/api/image-uri';
import type { CellUser } from '@/lib/colyseus/types';

import { MAP_PLAYER_AVATAR_SIZE, MapAvatar } from './map-avatar';

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
      <MapAvatar uri={uri} size={MAP_PLAYER_AVATAR_SIZE} halo={false} onReady={() => setReadyUri(uri)} />
    </Marker>
  );
}

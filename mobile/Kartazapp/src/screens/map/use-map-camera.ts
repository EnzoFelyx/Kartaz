import { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions } from 'react-native';
import type MapView from 'react-native-maps';
import type { LatLng, Region } from 'react-native-maps';

import {
  CAMERA_SETTLE_MS,
  EXPLORE_MIN_ZOOM,
  MOVE_EPSILON_DEG,
  SNAP_BACK_MS,
  USER_FOCUS_MS,
  USER_FOCUS_ZOOM,
  ZOOM_EPSILON,
} from './constants';
import type { MapRoomActionsRef } from './room-actions';

/**
 * Zoom do Google Maps a partir da região visível. No zoom z o mundo tem 256·2^z pontos de largura,
 * então a tela (`mapWidth` pontos) mostra `360·mapWidth / (256·2^z)` graus de longitude.
 */
function zoomFromRegion(region: Region, mapWidth: number) {
  return Math.log2((360 * mapWidth) / (256 * Math.max(region.longitudeDelta, 1e-9)));
}

export function isExploreZoom(zoom: number) {
  return zoom >= EXPLORE_MIN_ZOOM - ZOOM_EPSILON;
}

/**
 * Câmera do mapa e posição do jogador, que fica fixo no centro: a câmera vai até o GPS ao abrir,
 * soltar o dedo depois de arrastar = andar até o centro, e sem energia (Explore ON) a câmera volta.
 * Movimentos da própria câmera (animações) não contam como andar (`acceptMovesAfterRef`).
 */
export function useMapCamera(gpsCoords: LatLng | null, roomActions: MapRoomActionsRef) {
  const mapRef = useRef<MapView>(null);
  const [mapReady, setMapReady] = useState(false);
  /** Centro do mapa depois que o jogador arrasta; antes disso vale a posição do GPS. */
  const [draggedPosition, setDraggedPosition] = useState<LatLng | null>(null);
  const playerPosition = draggedPosition ?? gpsCoords;
  /** Zoom atual (`null` até a câmera ir para o jogador). */
  const [zoom, setZoom] = useState<number | null>(null);
  /** Até quando ignorar movimentos (carga inicial e animações da câmera); `null` = câmera ainda não focou. */
  const acceptMovesAfterRef = useRef<number | null>(null);

  // Lida dentro do handler do mapa (sem recriá-lo a cada movimento).
  const playerPositionRef = useRef(playerPosition);
  useEffect(() => {
    playerPositionRef.current = playerPosition;
  }, [playerPosition]);

  /** Volta a câmera (e o jogador) para `position` — movimento bloqueado sem energia. */
  const snapBack = useCallback((position: LatLng) => {
    acceptMovesAfterRef.current = Date.now() + SNAP_BACK_MS + CAMERA_SETTLE_MS;
    setDraggedPosition(position);
    mapRef.current?.animateCamera({ center: position }, { duration: SNAP_BACK_MS });
  }, []);

  // Primeira posição do GPS: leva a câmera até o jogador. Espera o mapa carregar
  // (antes disso o `animateCamera` é ignorado).
  useEffect(() => {
    if (!mapReady || !gpsCoords || acceptMovesAfterRef.current !== null) return;
    acceptMovesAfterRef.current = Date.now() + USER_FOCUS_MS + CAMERA_SETTLE_MS;
    roomActions.current.setPosition(gpsCoords.latitude, gpsCoords.longitude);
    mapRef.current?.animateCamera({ center: gpsCoords, zoom: USER_FOCUS_ZOOM }, { duration: USER_FOCUS_MS });
  }, [mapReady, gpsCoords, roomActions]);

  // O jogador fica fixo no centro da tela: soltar o dedo depois de arrastar = mover para o centro.
  const handleRegionChangeComplete = useCallback(
    (region: Region) => {
      const acceptAfter = acceptMovesAfterRef.current;
      if (acceptAfter === null) return; // câmera ainda não foi até o jogador

      // O mapa ocupa a largura da tela toda.
      const nextZoom = zoomFromRegion(region, Dimensions.get('window').width);
      setZoom(nextZoom);
      if (Date.now() < acceptAfter) return; // fim de uma animação da câmera, não é movimento

      const current = playerPositionRef.current;
      const moved =
        !current ||
        Math.abs(current.latitude - region.latitude) > MOVE_EPSILON_DEG ||
        Math.abs(current.longitude - region.longitude) > MOVE_EPSILON_DEG;
      if (!moved) return;

      const { outOfEnergy, updatePosition, setPosition } = roomActions.current;
      const nextExplore = isExploreZoom(nextZoom);
      // Explore ON sem energia: não anda (volta para onde estava). Explore OFF navega livre.
      if (nextExplore && outOfEnergy && current) {
        snapBack(current);
        return;
      }

      const next = { latitude: region.latitude, longitude: region.longitude };
      setDraggedPosition(next);
      if (nextExplore) updatePosition(next.latitude, next.longitude);
      else setPosition(next.latitude, next.longitude); // navegação "cega": não envia nem gasta
    },
    [roomActions, snapBack],
  );

  return {
    mapRef,
    onMapReady: () => setMapReady(true),
    playerPosition,
    /** Posição atual lida fora do render (ex.: no meio da sequência do radar). */
    playerPositionRef,
    zoom,
    acceptMovesAfterRef,
    snapBack,
    handleRegionChangeComplete,
  };
}

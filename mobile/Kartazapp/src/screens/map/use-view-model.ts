import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { ExplorerHintVariant } from '@/components/map/explorer-hint';
import { useCurrentUser } from '@/hooks/queries/use-current-user';
import { useSession } from '@/hooks/queries/use-session';
import { useWallet } from '@/hooks/queries/use-wallet';
import { useCellRoom, type CellRoomProfile, type RadarFailure } from '@/hooks/use-cell-room';
import { useInitialLocation } from '@/hooks/use-initial-location';
import { usePlaceName } from '@/hooks/use-place-name';
import { resolveApiUri } from '@/lib/api/image-uri';
import { DEFAULT_MAX_ENERGY, RADAR_COST_PERCENT } from '@/lib/game/rules';

import type { MapRoomActions } from './room-actions';
import { isExploreZoom, useMapCamera } from './use-map-camera';
import { useMapHud } from './use-map-hud';
import { useMapRadar } from './use-map-radar';
import { useVisibleCards } from './use-visible-cards';

// Ainda fixos até as cartas existirem.
const MOCK_ZONE = { difficulty: 'medium' as const };

const NOT_CONNECTED: RadarFailure = { reason: 'not_connected' };

/**
 * Mapa: junta a câmera/posição do jogador (`useMapCamera`), o radar (`useMapRadar`), a sala da célula
 * H3 em tempo real (`useCellRoom`), as cartas visíveis, o HUD e os modais (abastecer, packs).
 * O Explore Mode liga pelo zoom (ou durante o radar) e é ele que conecta a sala.
 */
export function useMapViewModel() {
  const { coords: gpsCoords } = useInitialLocation();
  const { data: session } = useSession();
  const { data: user } = useCurrentUser();
  const { data: wallet } = useWallet();
  const [refuelOpen, setRefuelOpen] = useState(false);

  // Ações da sala para a câmera e o radar (preenchidas depois que a sala existe, logo abaixo).
  const roomActions = useRef<MapRoomActions>({
    updatePosition: () => {},
    setPosition: () => {},
    radarScan: () => Promise.reject(NOT_CONNECTED),
    outOfEnergy: false,
  });

  const camera = useMapCamera(gpsCoords, roomActions);
  const radar = useMapRadar({
    mapRef: camera.mapRef,
    acceptMovesAfterRef: camera.acceptMovesAfterRef,
    playerPositionRef: camera.playerPositionRef,
    roomActions,
  });
  // Durante o radar a câmera se afasta, mas o jogador continua na sala (Explore segue ligado).
  const exploreOn = (camera.zoom !== null && isExploreZoom(camera.zoom)) || radar.locked;

  // Dados enviados à sala; o backend usa os do banco para fuel/xp/level quando existem.
  const profile = useMemo<CellRoomProfile | null>(() => {
    if (!session) return null;
    return {
      userId: session.userId,
      username: user?.username ?? session.username,
      avatarId: String(user?.avatarId ?? session.avatarId ?? ''),
      fuel: user?.fuel ?? DEFAULT_MAX_ENERGY,
      xp: user?.xp ?? 0,
      level: user?.level ?? 1,
    };
  }, [session, user?.username, user?.avatarId, user?.fuel, user?.xp, user?.level]);

  const { snapBack } = camera;
  const handleMoveRejected = useCallback(
    (lat: number, lng: number) => snapBack({ latitude: lat, longitude: lng }),
    [snapBack],
  );

  // Explore ON: conectado à sala da célula. OFF: fora de sala (navega livre, sem dados nem gasto).
  const room = useCellRoom(profile, { enabled: exploreOn, onMoveRejected: handleMoveRejected });
  const hud = useMapHud(room.self, user);
  const visibleCards = useVisibleCards(room.cards, camera.playerPosition);
  const placeName = usePlaceName(camera.playerPosition, exploreOn);

  const { setPosition, updatePosition, radarScan } = room;
  useEffect(() => {
    roomActions.current = { setPosition, updatePosition, radarScan, outOfEnergy: hud.outOfEnergy };
  }, [setPosition, updatePosition, radarScan, hud.outOfEnergy]);

  // Muda a cada vez que a aba ganha foco; usado como `key` do HUD do topo para
  // remontá-lo e reiniciar a animação de entrada.
  const [focusCount, setFocusCount] = useState(0);
  useFocusEffect(
    useCallback(() => {
      setFocusCount((count) => count + 1);
    }, []),
  );

  const hint: ExplorerHintVariant | null =
    camera.zoom === null ? null : !exploreOn ? 'zoomIn' : hud.outOfEnergy ? 'noEnergy' : null;

  return {
    mapRef: camera.mapRef,
    onMapReady: camera.onMapReady,
    handleRegionChangeComplete: camera.handleRegionChangeComplete,
    radarLocked: radar.locked,
    coins: room.coins,
    batteries: room.batteries,
    /** Cartas no mapa: todas da sala durante o radar; fora dele, só as da célula res 9 do jogador. */
    mapCards: radar.radarCards ?? visibleCards,
    discoveryFlags: room.discoveryFlags,
    otherUsers: room.otherUsers,
    playerPosition: camera.playerPosition,
    avatarUri: resolveApiUri(user?.avatar),
    avatarName: user?.username ?? session?.username,
    focusCount,
    energy: hud.energy,
    maxEnergy: hud.maxEnergy,
    level: hud.level,
    xp: hud.xp,
    balance: wallet?.balance ?? 0,
    lastCoinGain: room.lastCoinGain,
    hint,
    placeName,
    difficulty: MOCK_ZONE.difficulty,
    // Painel: com o Explore desligado, os dados da sala aparecem como "—".
    dashboardNearby: exploreOn ? room.nearbyCount : null,
    dashboardCards: exploreOn && room.connected ? room.cards.length : null,
    dashboardFlagOwner: exploreOn ? room.flagOwnerName : undefined,
    distanceKm: hud.distanceKm,
    exploreOn,
    xpProgress: hud.xpProgress,
    radarSearching: radar.searching,
    canRadar: exploreOn && room.connected && !radar.locked && hud.energy >= (hud.maxEnergy * RADAR_COST_PERCENT) / 100,
    radarCooldownSeconds: radar.cooldownSeconds,
    handleRadarSearch: radar.scan,
    refuelOpen,
    openRefuel: () => setRefuelOpen(true),
    closeRefuel: () => setRefuelOpen(false),
    fillTankPrice: room.fillTankPrice,
    roomConnected: exploreOn && room.connected,
    purchaseFuel: room.purchaseFuel,
    // O pack não abre por cima do "Abastecer".
    visiblePack: refuelOpen ? null : room.cardsPack,
    dismissCardsPack: room.dismissCardsPack,
  };
}

export type MapViewModel = ReturnType<typeof useMapViewModel>;

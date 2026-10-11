import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import MapView, { PROVIDER_GOOGLE, type LatLng, type Region } from 'react-native-maps';
import Animated, { Easing, withTiming, type EntryAnimationsValues } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FuelGauge } from '@/components/hud/fuel-gauge';
import { LevelCard } from '@/components/hud/level-card';
import { MapDashboard } from '@/components/map-dashboard';
import { ExplorerHint } from '@/components/map/explorer-hint';
import { MAP_PLAYER_AVATAR_SIZE, MapAvatar } from '@/components/map/map-avatar';
import { MapGradientOverlay } from '@/components/map/map-gradient-overlay';
import { MapGridOverlay } from '@/components/map/map-grid-overlay';
import { OtherPlayerMarker } from '@/components/map/other-player-marker';
import { TAB_BAR_BOTTOM_GAP, TAB_BAR_HEIGHT } from '@/components/tab-bar';
import { useCurrentUser } from '@/hooks/queries/use-current-user';
import { useSession } from '@/hooks/queries/use-session';
import { useCellRoom, type CellRoomProfile } from '@/hooks/use-cell-room';
import { useInitialLocation } from '@/hooks/use-initial-location';
import { usePlaceName } from '@/hooks/use-place-name';
import { resolveApiUri } from '@/lib/api/image-uri';
import { colors } from '@/theme/colors';
import { initialMapRegion, kartazMapStyle, mapViewConfig } from '@/theme/map-styles';

// Ainda fixos até as cartas existirem.
const MOCK_ZONE = { difficulty: 'medium' as const, xpBonus: 0, multiplier: 1.5 };
/** Tempo da busca do radar (só visual, até a resposta vir do servidor). */
const MOCK_RADAR_SEARCH_MS = 1200;
/** Sem regra de level ainda: a barra do painel mostra o XP dentro do bloco atual de 100. */
const XP_BAR_STEP = 100;
const DEFAULT_MAX_ENERGY = 100;

/** Explore Mode liga a partir deste zoom (≈ hexágono res 8 ocupando ~1/4 da tela). */
const EXPLORE_MIN_ZOOM = 14;
/** Zoom da câmera ao focar no jogador (nível de bairro/ruas). */
const USER_FOCUS_ZOOM = 16;
const USER_FOCUS_MS = 1000;
/** Animação de volta quando o movimento é bloqueado (sem energia). */
const SNAP_BACK_MS = 400;
/** Margem depois de uma animação da câmera: o `onRegionChangeComplete` dela não é movimento do jogador. */
const CAMERA_SETTLE_MS = 400;
/** Movimentos menores que isso (graus) são ruído do mapa, não arrasto. */
const MOVE_EPSILON_DEG = 1e-6;
/** Distância entre o painel e a tab bar. */
const DASHBOARD_GAP = 12;

/** Entrada do HUD do topo: escorrega um pouco de cima até a posição, sem mola. */
const HUD_SLIDE_DISTANCE = 32;
const HUD_SLIDE_MS = 600;

function hudTopEntering(_values: EntryAnimationsValues) {
  'worklet';
  const config = { duration: HUD_SLIDE_MS, easing: Easing.out(Easing.cubic) };
  return {
    initialValues: { opacity: 0, transform: [{ translateY: -HUD_SLIDE_DISTANCE }] },
    animations: {
      opacity: withTiming(1, config),
      transform: [{ translateY: withTiming(0, config) }],
    },
  };
}

/** Zoom do Google Maps a partir da região visível. */
function zoomFromRegion(region: Region) {
  return Math.log2(360 / Math.max(region.longitudeDelta, 1e-9));
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [radarSearching, setRadarSearching] = useState(false);
  const mapRef = useRef<MapView>(null);
  const { coords: gpsCoords } = useInitialLocation();
  const { data: session } = useSession();
  const { data: user } = useCurrentUser();
  const [mapReady, setMapReady] = useState(false);
  /** Centro do mapa depois que o jogador arrasta; antes disso vale a posição do GPS. */
  const [draggedPosition, setDraggedPosition] = useState<LatLng | null>(null);
  const playerPosition = draggedPosition ?? gpsCoords;
  /** Zoom atual (`null` até a câmera ir para o jogador). */
  const [zoom, setZoom] = useState<number | null>(null);
  const exploreOn = zoom !== null && zoom >= EXPLORE_MIN_ZOOM;
  /** Até quando ignorar movimentos (carga inicial e animações da câmera); `null` = câmera ainda não focou. */
  const acceptMovesAfterRef = useRef<number | null>(null);

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

  /** Volta a câmera (e o jogador) para `position` — movimento bloqueado sem energia. */
  const snapBack = useCallback((position: LatLng) => {
    acceptMovesAfterRef.current = Date.now() + SNAP_BACK_MS + CAMERA_SETTLE_MS;
    setDraggedPosition(position);
    mapRef.current?.animateCamera({ center: position }, { duration: SNAP_BACK_MS });
  }, []);

  const handleMoveRejected = useCallback(
    (lat: number, lng: number) => snapBack({ latitude: lat, longitude: lng }),
    [snapBack],
  );

  // Explore ON: conectado à sala da célula. OFF: fora de sala (navega livre, sem dados nem gasto).
  const { otherUsers, self, nearbyCount, setPosition, updatePosition } = useCellRoom(profile, {
    enabled: exploreOn,
    onMoveRejected: handleMoveRejected,
  });

  // Valores autoritativos do servidor: da sala (tempo real) ou do GET /user (fora de sala).
  const energy = self?.fuel ?? user?.fuel ?? DEFAULT_MAX_ENERGY;
  const maxEnergy = self?.maxFuel ?? DEFAULT_MAX_ENERGY;
  const xp = self?.xp ?? user?.xp ?? 0;
  const level = self?.level ?? user?.level ?? 1;
  const coverage = self?.coverage ?? user?.coverage ?? 0;
  const distanceKm = self?.distanceKm ?? user?.distanceKm ?? 0;
  const outOfEnergy = energy <= 0;
  const placeName = usePlaceName(playerPosition, exploreOn);

  // Lidos dentro do handler do mapa (sem recriá-lo a cada patch da sala).
  const gestureStateRef = useRef({ playerPosition, outOfEnergy });
  useEffect(() => {
    gestureStateRef.current = { playerPosition, outOfEnergy };
  }, [playerPosition, outOfEnergy]);

  // Primeira posição do GPS: leva a câmera até o jogador. Espera o mapa carregar
  // (antes disso o `animateCamera` é ignorado).
  useEffect(() => {
    if (!mapReady || !gpsCoords || acceptMovesAfterRef.current !== null) return;
    acceptMovesAfterRef.current = Date.now() + USER_FOCUS_MS + CAMERA_SETTLE_MS;
    setPosition(gpsCoords.latitude, gpsCoords.longitude);
    mapRef.current?.animateCamera({ center: gpsCoords, zoom: USER_FOCUS_ZOOM }, { duration: USER_FOCUS_MS });
  }, [mapReady, gpsCoords, setPosition]);

  // O jogador fica fixo no centro da tela: soltar o dedo depois de arrastar = mover para o centro.
  const handleRegionChangeComplete = useCallback(
    (region: Region) => {
      const acceptAfter = acceptMovesAfterRef.current;
      if (acceptAfter === null) return; // câmera ainda não foi até o jogador

      const nextZoom = zoomFromRegion(region);
      setZoom(nextZoom);
      if (Date.now() < acceptAfter) return; // fim de uma animação da câmera, não é movimento

      const { playerPosition: current, outOfEnergy: noEnergy } = gestureStateRef.current;
      const moved =
        !current ||
        Math.abs(current.latitude - region.latitude) > MOVE_EPSILON_DEG ||
        Math.abs(current.longitude - region.longitude) > MOVE_EPSILON_DEG;
      if (!moved) return;

      const nextExplore = nextZoom >= EXPLORE_MIN_ZOOM;
      // Explore ON sem energia: não anda (volta para onde estava). Explore OFF navega livre.
      if (nextExplore && noEnergy && current) {
        snapBack(current);
        return;
      }

      const next = { latitude: region.latitude, longitude: region.longitude };
      setDraggedPosition(next);
      if (nextExplore) updatePosition(next.latitude, next.longitude);
      else setPosition(next.latitude, next.longitude); // navegação "cega": não envia nem gasta
    },
    [setPosition, snapBack, updatePosition],
  );

  // Muda a cada vez que a aba ganha foco; usado como `key` do HUD do topo para
  // remontá-lo e reiniciar a animação de entrada.
  const [focusCount, setFocusCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setFocusCount((count) => count + 1);
    }, []),
  );
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
  }, []);

  // Intenção de busca: no futuro vira uma chamada ao servidor, que decide o resultado.
  const handleRadarSearch = () => {
    setRadarSearching(true);
    searchTimeout.current = setTimeout(() => setRadarSearching(false), MOCK_RADAR_SEARCH_MS);
  };

  const hint = zoom === null ? null : !exploreOn ? 'zoomIn' : outOfEnergy ? 'noEnergy' : null;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        onMapReady={() => setMapReady(true)}
        onRegionChangeComplete={handleRegionChangeComplete}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        customMapStyle={kartazMapStyle}
        initialRegion={initialMapRegion}
        {...mapViewConfig}>
        {otherUsers.map((player) => (
          <OtherPlayerMarker
            key={player.sessionId}
            player={player}
            accessibilityLabel={t('map.playerHere', { name: player.username })}
          />
        ))}
      </MapView>
      <MapGradientOverlay />
      <MapGridOverlay />

      {/* Jogador fixo no centro da tela (o mapa se move por baixo dele). */}
      {playerPosition && (
        <View
          style={styles.selfAvatar}
          pointerEvents="none"
          accessible
          accessibilityLabel={t('map.youAreHere')}>
          <MapAvatar uri={resolveApiUri(user?.avatar)} size={MAP_PLAYER_AVATAR_SIZE} highlighted halo={false} />
        </View>
      )}

      {/* HUD do topo: Energy à esquerda (ocupa o espaço livre) e Level/XP à direita. */}
      <Animated.View
        key={focusCount}
        entering={hudTopEntering}
        style={[styles.hudTop, { top: insets.top + 8 }]}
        pointerEvents="box-none">
        <FuelGauge fuel={energy} maxFuel={maxEnergy} style={styles.fuel} />
        <LevelCard level={level} xp={xp} />
      </Animated.View>

      <View
        style={[styles.bottomHud, { bottom: insets.bottom + TAB_BAR_BOTTOM_GAP + TAB_BAR_HEIGHT + DASHBOARD_GAP }]}
        pointerEvents="box-none">
        {hint && <ExplorerHint key={hint} variant={hint} />}
        <MapDashboard
          location={placeName}
          difficulty={MOCK_ZONE.difficulty}
          nearbyCount={exploreOn ? nearbyCount : null}
          coverage={coverage}
          distanceKm={distanceKm}
          xpBonus={MOCK_ZONE.xpBonus}
          multiplier={MOCK_ZONE.multiplier}
          exploreOn={exploreOn}
          xpProgress={(xp % XP_BAR_STEP) / XP_BAR_STEP}
          searching={radarSearching}
          canSearch={exploreOn && !outOfEnergy}
          onRadarSearch={handleRadarSearch}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  selfAvatar: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hudTop: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
  },
  fuel: {
    flex: 1,
    justifyContent: 'center',
  },
  bottomHud: {
    position: 'absolute',
    left: 16,
    right: 16,
    gap: 8,
  },
});

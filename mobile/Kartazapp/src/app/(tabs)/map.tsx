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
import { MapGradientOverlay } from '@/components/map/map-gradient-overlay';
import { MapGridOverlay } from '@/components/map/map-grid-overlay';
import { MapAvatar } from '@/components/map/map-avatar';
import { OtherPlayerMarker } from '@/components/map/other-player-marker';
import { TAB_BAR_BOTTOM_GAP, TAB_BAR_HEIGHT } from '@/components/tab-bar';
import { useCurrentUser } from '@/hooks/queries/use-current-user';
import { useSession } from '@/hooks/queries/use-session';
import { useCellRoom, type CellRoomProfile } from '@/hooks/use-cell-room';
import { useInitialLocation } from '@/hooks/use-initial-location';
import { resolveApiUri } from '@/lib/api/image-uri';
import { colors } from '@/theme/colors';
import { initialMapRegion, kartazMapStyle, mapViewConfig } from '@/theme/map-styles';

// Mock até termos a store do jogador (Fase 4 do todo).
const MOCK_PLAYER = { fuel: 78, maxFuel: 100, level: 12, xp: 2450 };
// `zoneId` é a chave de tradução do nome da zona (`zones.<id>`).
const MOCK_ZONE = {
  zoneId: 'southAmerica' as const,
  difficulty: 'medium' as const,
  discovered: 0,
  totalCards: 5,
  heat: 78,
  xpReward: 350,
  multiplier: 1.5,
};
/** Tempo da busca do radar (só visual, até a resposta vir do servidor). */
const MOCK_RADAR_SEARCH_MS = 1200;
/** Zoom da câmera ao focar no jogador (nível de bairro/ruas). */
const USER_FOCUS_ZOOM = 16;
const USER_FOCUS_MS = 1000;
/** Margem depois da animação da câmera: o `onRegionChangeComplete` dela não é movimento do jogador. */
const CAMERA_SETTLE_MS = 400;
const SELF_AVATAR_SIZE = 48;
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

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { zoneId, ...zone } = MOCK_ZONE;
  const [radarSearching, setRadarSearching] = useState(false);
  const mapRef = useRef<MapView>(null);
  const { coords: gpsCoords } = useInitialLocation();
  const { data: session } = useSession();
  const { data: user } = useCurrentUser();
  const [mapReady, setMapReady] = useState(false);
  /** Centro do mapa depois que o jogador arrasta; antes disso vale a posição do GPS. */
  const [draggedPosition, setDraggedPosition] = useState<LatLng | null>(null);
  const playerPosition = draggedPosition ?? gpsCoords;
  /** Até quando ignorar `onRegionChangeComplete` (carga inicial e animação até o jogador). */
  const acceptMovesAfterRef = useRef<number | null>(null);

  // Dados enviados à sala; o backend usa os do banco para fuel/xp/level quando existem.
  const profile = useMemo<CellRoomProfile | null>(() => {
    if (!session) return null;
    return {
      userId: session.userId,
      username: user?.username ?? session.username,
      avatarId: String(user?.avatarId ?? session.avatarId ?? ''),
      fuel: user?.fuel ?? 100,
      xp: user?.xp ?? 0,
      level: user?.level ?? 1,
    };
  }, [session, user?.username, user?.avatarId, user?.fuel, user?.xp, user?.level]);
  const { otherUsers, updatePosition } = useCellRoom(profile);

  // Primeira posição do GPS: leva a câmera até o jogador. Espera o mapa carregar
  // (antes disso o `animateCamera` é ignorado).
  useEffect(() => {
    if (!mapReady || !gpsCoords || acceptMovesAfterRef.current !== null) return;
    acceptMovesAfterRef.current = Date.now() + USER_FOCUS_MS + CAMERA_SETTLE_MS;
    mapRef.current?.animateCamera({ center: gpsCoords, zoom: USER_FOCUS_ZOOM }, { duration: USER_FOCUS_MS });
  }, [mapReady, gpsCoords]);

  // Toda nova posição do jogador (GPS inicial ou arrasto) vai para a sala da célula H3.
  useEffect(() => {
    if (playerPosition) updatePosition(playerPosition.latitude, playerPosition.longitude);
  }, [playerPosition, updatePosition]);

  // O jogador fica fixo no centro da tela: soltar o dedo depois de arrastar = mover para o centro.
  const handleRegionChangeComplete = useCallback((region: Region) => {
    const acceptAfter = acceptMovesAfterRef.current;
    if (acceptAfter === null || Date.now() < acceptAfter) return;
    setDraggedPosition((previous) =>
      previous?.latitude === region.latitude && previous?.longitude === region.longitude
        ? previous
        : { latitude: region.latitude, longitude: region.longitude },
    );
  }, []);
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
          <MapAvatar uri={resolveApiUri(user?.avatar)} size={SELF_AVATAR_SIZE} highlighted />
        </View>
      )}

      {/* HUD do topo: Fuel à esquerda (ocupa o espaço livre) e Level/XP à direita. */}
      <Animated.View
        key={focusCount}
        entering={hudTopEntering}
        style={[styles.hudTop, { top: insets.top + 8 }]}
        pointerEvents="box-none">
        <FuelGauge
          fuel={MOCK_PLAYER.fuel}
          maxFuel={MOCK_PLAYER.maxFuel}
          style={styles.fuel}
        />
        <LevelCard level={MOCK_PLAYER.level} xp={MOCK_PLAYER.xp} />
      </Animated.View>

      <MapDashboard
        {...zone}
        zone={t(`zones.${zoneId}`)}
        searching={radarSearching}
        canSearch={MOCK_PLAYER.fuel >= 1}
        onRadarSearch={handleRadarSearch}
        style={[
          styles.dashboard,
          { bottom: insets.bottom + TAB_BAR_BOTTOM_GAP + TAB_BAR_HEIGHT + DASHBOARD_GAP },
        ]}
      />
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
  dashboard: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
});

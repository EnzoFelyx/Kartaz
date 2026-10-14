import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, StyleSheet, View } from 'react-native';
import MapView, { PROVIDER_GOOGLE, type LatLng, type Region } from 'react-native-maps';
import Animated, { Easing, withTiming, type EntryAnimationsValues } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CardsPackModal } from '@/components/cards/cards-pack-modal';
import { FuelGauge } from '@/components/hud/fuel-gauge';
import { CoinBalance } from '@/components/hud/coin-balance';
import { BatteryIcon } from '@/components/icons/battery-icon';
import { CoinIcon } from '@/components/icons/coin-icon';
import { LevelCard } from '@/components/hud/level-card';
import { RefuelModal } from '@/components/hud/refuel-modal';
import { MapDashboard } from '@/components/map-dashboard';
import { ExplorerHint } from '@/components/map/explorer-hint';
import { DiscoveryFlagMarker } from '@/components/map/discovery-flag-marker';
import { MAP_PLAYER_AVATAR_SIZE, MapAvatar } from '@/components/map/map-avatar';
import { MapGradientOverlay } from '@/components/map/map-gradient-overlay';
import { MapGridOverlay } from '@/components/map/map-grid-overlay';
import { MapCardMarker } from '@/components/map/map-card-marker';
import { PickupMarker } from '@/components/map/pickup-marker';
import { OtherPlayerMarker } from '@/components/map/other-player-marker';
import { TAB_BAR_BOTTOM_GAP, TAB_BAR_HEIGHT } from '@/components/tab-bar';
import { useCurrentUser } from '@/hooks/queries/use-current-user';
import { useSession } from '@/hooks/queries/use-session';
import { useWallet } from '@/hooks/queries/use-wallet';
import { useCellRoom, type CellRoomProfile } from '@/hooks/use-cell-room';
import { useInitialLocation } from '@/hooks/use-initial-location';
import { usePlaceName } from '@/hooks/use-place-name';
import { resolveApiUri } from '@/lib/api/image-uri';
import { getUserCell } from '@/lib/h3/cells';
import { colors } from '@/theme/colors';
import { initialMapRegion, kartazMapStyle, mapViewConfig } from '@/theme/map-styles';

// Ainda fixos até as cartas existirem.
const MOCK_ZONE = { difficulty: 'medium' as const };
/** Tempo da busca do radar (só visual, até a resposta vir do servidor). */
const MOCK_RADAR_SEARCH_MS = 1200;
const DEFAULT_MAX_ENERGY = 100;

/** Explore Mode liga a partir deste zoom (nível de ruas). */
const EXPLORE_MIN_ZOOM = 18;
/** Zoom da câmera ao focar no jogador: já começa com o Explore Mode ligado. */
const USER_FOCUS_ZOOM = 18;
/** Folga do arredondamento ao comparar o zoom calculado com o limite (ex.: 17,999 conta como 18). */
const ZOOM_EPSILON = 0.05;
const USER_FOCUS_MS = 1000;
/** Animação de volta quando o movimento é bloqueado (sem energia). */
const SNAP_BACK_MS = 400;
/** Margem depois de uma animação da câmera: o `onRegionChangeComplete` dela não é movimento do jogador. */
const CAMERA_SETTLE_MS = 400;
/** Movimentos menores que isso (graus) são ruído do mapa, não arrasto. */
const MOVE_EPSILON_DEG = 1e-6;
/** Tamanho dos itens coletáveis no mapa (moedas e baterias). */
const PICKUP_ICON_SIZE = 22;
/** Altura da carta virada no mapa (a largura sai da proporção da carta). */
const MAP_CARD_HEIGHT = 34;
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

/**
 * Zoom do Google Maps a partir da região visível. No zoom z o mundo tem 256·2^z pontos de largura,
 * então a tela (`mapWidth` pontos) mostra `360·mapWidth / (256·2^z)` graus de longitude.
 */
function zoomFromRegion(region: Region, mapWidth: number) {
  return Math.log2((360 * mapWidth) / (256 * Math.max(region.longitudeDelta, 1e-9)));
}

function isExploreZoom(zoom: number) {
  return zoom >= EXPLORE_MIN_ZOOM - ZOOM_EPSILON;
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [radarSearching, setRadarSearching] = useState(false);
  const [refuelOpen, setRefuelOpen] = useState(false);
  const mapRef = useRef<MapView>(null);
  const { coords: gpsCoords } = useInitialLocation();
  const { data: session } = useSession();
  const { data: user } = useCurrentUser();
  const { data: wallet } = useWallet();
  const [mapReady, setMapReady] = useState(false);
  /** Centro do mapa depois que o jogador arrasta; antes disso vale a posição do GPS. */
  const [draggedPosition, setDraggedPosition] = useState<LatLng | null>(null);
  const playerPosition = draggedPosition ?? gpsCoords;
  /** Zoom atual (`null` até a câmera ir para o jogador). */
  const [zoom, setZoom] = useState<number | null>(null);
  const exploreOn = zoom !== null && isExploreZoom(zoom);
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
  const {
    connected,
    otherUsers,
    self,
    nearbyCount,
    discoveryFlags,
    flagOwnerName,
    coins,
    batteries,
    cards,
    lastCoinGain,
    cardsPack,
    dismissCardsPack,
    fillTankPrice,
    purchaseFuel,
    setPosition,
    updatePosition,
  } = useCellRoom(profile, {
    enabled: exploreOn,
    onMoveRejected: handleMoveRejected,
  });

  // Cartas da sala (área res 8) só aparecem quando o jogador entra na mesma célula res 9 da carta.
  const playerCell = playerPosition ? getUserCell(playerPosition.latitude, playerPosition.longitude) : null;
  const visibleCards = useMemo(
    () => (playerCell ? cards.filter((card) => getUserCell(card.lat, card.lng) === playerCell) : []),
    [cards, playerCell],
  );

  // Carta que acabou de aparecer (entrou na célula dela ou nasceu na sua): vibração leve, uma vez
  // por atualização, por mais cartas que apareçam juntas. A animação dispara ao montar o marcador.
  const seenCardIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const ids = new Set(visibleCards.map((card) => card.id));
    const hasNew = visibleCards.some((card) => !seenCardIdsRef.current.has(card.id));
    seenCardIdsRef.current = ids;
    if (hasNew) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, [visibleCards]);

  // Valores autoritativos do servidor: da sala (tempo real) ou do GET /user (fora de sala).
  const energy = self?.fuel ?? user?.fuel ?? DEFAULT_MAX_ENERGY;
  const maxEnergy = self?.maxFuel ?? DEFAULT_MAX_ENERGY;
  const xp = self?.xp ?? user?.xp ?? 0;
  const level = self?.level ?? user?.level ?? 1;
  // Barra de XP: quanto do nível atual já foi feito (faixa calculada pelo servidor).
  const levelXpStart = self?.levelXpStart ?? user?.levelXpStart ?? 0;
  const levelXpEnd = self?.levelXpEnd ?? user?.levelXpEnd ?? 0;
  const xpProgress = levelXpEnd > levelXpStart ? (xp - levelXpStart) / (levelXpEnd - levelXpStart) : 1;
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

      // O mapa ocupa a largura da tela toda.
      const nextZoom = zoomFromRegion(region, Dimensions.get('window').width);
      setZoom(nextZoom);
      if (Date.now() < acceptAfter) return; // fim de uma animação da câmera, não é movimento

      const { playerPosition: current, outOfEnergy: noEnergy } = gestureStateRef.current;
      const moved =
        !current ||
        Math.abs(current.latitude - region.latitude) > MOVE_EPSILON_DEG ||
        Math.abs(current.longitude - region.longitude) > MOVE_EPSILON_DEG;
      if (!moved) return;

      const nextExplore = isExploreZoom(nextZoom);
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

  useEffect(
    () => () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    },
    [],
  );

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
        {/* Bandeira da área (sala) atual, se ninguém a coletou — como jogadores e cartas, só da própria sala. */}
        {/* Moedas e baterias da sala atual: paradas na coordenada, somem quando alguém coleta. */}
        {coins.map((coin) => (
          <PickupMarker
            key={coin.id}
            latitude={coin.lat}
            longitude={coin.lng}
            size={PICKUP_ICON_SIZE}
            icon={<CoinIcon size={PICKUP_ICON_SIZE} />}
            accessibilityLabel={t('map.coinA11y')}
          />
        ))}
        {batteries.map((battery) => (
          <PickupMarker
            key={battery.id}
            latitude={battery.lat}
            longitude={battery.lng}
            size={PICKUP_ICON_SIZE}
            icon={<BatteryIcon size={PICKUP_ICON_SIZE} />}
            accessibilityLabel={t('map.batteryA11y')}
          />
        ))}
        {visibleCards.map((card) => (
          <MapCardMarker key={card.id} card={card} height={MAP_CARD_HEIGHT} accessibilityLabel={t('map.cardA11y')} />
        ))}
        {discoveryFlags.map((flag) => (
          <DiscoveryFlagMarker key={flag.h3Index} flag={flag} accessibilityLabel={t('discoveryFlag.a11y')} />
        ))}
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
        <View style={styles.selfAvatar} pointerEvents="none" accessible accessibilityLabel={t('map.youAreHere')}>
          <MapAvatar
            uri={resolveApiUri(user?.avatar)}
            name={user?.username ?? session?.username}
            size={MAP_PLAYER_AVATAR_SIZE}
            highlighted
            halo={false}
          />
        </View>
      )}

      {/* HUD do topo: Energy à esquerda (ocupa o espaço livre) e Level/XP à direita. */}
      <Animated.View
        key={focusCount}
        entering={hudTopEntering}
        style={[styles.hudTop, { top: insets.top + 8 }]}
        pointerEvents="box-none">
        <View style={styles.hudRow}>
          <FuelGauge fuel={energy} maxFuel={maxEnergy} style={styles.fuel} onPress={() => setRefuelOpen(true)} />
          <LevelCard level={level} xp={xp} />
        </View>
        {/* Saldo de moedas embaixo do nível, à direita (com o "+N" animado a cada coleta). */}
        <CoinBalance balance={wallet?.balance ?? 0} lastGain={lastCoinGain} />
      </Animated.View>

      <View
        style={[styles.bottomHud, { bottom: insets.bottom + TAB_BAR_BOTTOM_GAP + TAB_BAR_HEIGHT + DASHBOARD_GAP }]}
        pointerEvents="box-none">
        {hint && <ExplorerHint key={hint} variant={hint} />}
        <MapDashboard
          location={placeName}
          difficulty={MOCK_ZONE.difficulty}
          nearbyCount={exploreOn ? nearbyCount : null}
          cardsCount={exploreOn && connected ? cards.length : null}
          distanceKm={distanceKm}
          flagOwnerName={exploreOn ? flagOwnerName : undefined}
          exploreOn={exploreOn}
          xpProgress={xpProgress}
          searching={radarSearching}
          canSearch={exploreOn && !outOfEnergy}
          onRadarSearch={handleRadarSearch}
        />
      </View>

      <RefuelModal
        visible={refuelOpen}
        onClose={() => setRefuelOpen(false)}
        fuel={energy}
        maxFuel={maxEnergy}
        balance={wallet?.balance ?? 0}
        price={fillTankPrice}
        connected={exploreOn && connected}
        onPurchase={purchaseFuel}
      />

      {/* Pack de boas-vindas / diário: chega depois de andar ~10 m na sala (um por vez, na ordem de chegada). */}
      <CardsPackModal pack={refuelOpen ? null : cardsPack} onClose={dismissCardsPack} />
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
    gap: 8,
  },
  hudRow: {
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

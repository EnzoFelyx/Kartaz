import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions } from 'react-native';
import type MapView from 'react-native-maps';
import type { LatLng, Region } from 'react-native-maps';

import type { ExplorerHintVariant } from '@/components/map/explorer-hint';
import { useCurrentUser } from '@/hooks/queries/use-current-user';
import { useSession } from '@/hooks/queries/use-session';
import { useWallet } from '@/hooks/queries/use-wallet';
import { useCellRoom, type CellRoomProfile, type RadarFailure } from '@/hooks/use-cell-room';
import { useInitialLocation } from '@/hooks/use-initial-location';
import { usePlaceName } from '@/hooks/use-place-name';
import { resolveApiUri } from '@/lib/api/image-uri';
import type { CellCard } from '@/lib/colyseus/types';
import { getRoomBoundary, getUserCell } from '@/lib/h3/cells';
import { toast } from '@/lib/toast/toast-store';

// Ainda fixos até as cartas existirem.
const MOCK_ZONE = { difficulty: 'medium' as const };
const DEFAULT_MAX_ENERGY = 100;

/** Radar: energia gasta por uso (% da máxima; quem cobra é o servidor) e a sequência da câmera. */
const RADAR_COST_PERCENT = 10;
/** Zoom out até enquadrar a sala inteira. */
const RADAR_ZOOM_OUT_MS = 800;
/** Tempo com as cartas reveladas (tela travada). */
const RADAR_REVEAL_MS = 3000;
/** Volta ao zoom do Explore, no jogador. */
const RADAR_ZOOM_BACK_MS = 800;
/** Folga nas bordas ao enquadrar a sala (o painel de baixo ocupa espaço). */
const RADAR_EDGE_PADDING = { top: 160, right: 48, bottom: 300, left: 48 };

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

/**
 * Mapa: posição do jogador (GPS e arrasto, com o jogador fixo no centro), Explore Mode pelo zoom,
 * sala da célula H3 (outros jogadores, moedas, baterias, cartas, bandeira), energia/XP/moedas,
 * radar (cobra energia, revela as cartas da sala com zoom out e trava a tela), abastecer e packs.
 */
export function useMapViewModel() {
  const { t } = useTranslation();
  const [radarSearching, setRadarSearching] = useState(false);
  /** Cartas reveladas pelo radar (todas da sala) enquanto a tela está travada; `null` fora do radar. */
  const [radarCards, setRadarCards] = useState<CellCard[] | null>(null);
  /** Até quando o radar fica em espera (ms, relógio do servidor ≈ aparelho). */
  const [radarCooldownUntil, setRadarCooldownUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const radarLocked = radarCards !== null;
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
  // Durante o radar a câmera se afasta, mas o jogador continua na sala (Explore segue ligado).
  const exploreOn = (zoom !== null && isExploreZoom(zoom)) || radarLocked;
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
    radarScan,
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
  // Sequência do radar (zoom out → cartas reveladas → volta): timers limpos ao sair da tela.
  const radarTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => radarTimersRef.current.forEach(clearTimeout), []);

  // Contagem da espera do radar no botão (atualiza a cada segundo só enquanto há espera).
  useEffect(() => {
    if (radarCooldownUntil <= Date.now()) return;
    const interval = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= radarCooldownUntil) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [radarCooldownUntil]);
  const radarCooldownSeconds = Math.max(0, Math.ceil((radarCooldownUntil - now) / 1000));

  /**
   * Revela as cartas da sala: trava a tela, afasta a câmera até a sala (res 8) caber, mostra todas as
   * cartas por 3 s e volta ao zoom do Explore no jogador. Movimentos da câmera nesse tempo não contam
   * como andar (`acceptMovesAfterRef`).
   */
  const revealRadar = (revealed: CellCard[]) => {
    const center = gestureStateRef.current.playerPosition;
    const map = mapRef.current;
    if (!center || !map) return;
    acceptMovesAfterRef.current = Number.POSITIVE_INFINITY;
    setRadarCards(revealed);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    const points = [
      ...getRoomBoundary(center.latitude, center.longitude),
      ...revealed.map((card) => ({ latitude: card.lat, longitude: card.lng })),
      center,
    ];
    map.fitToCoordinates(points, { edgePadding: RADAR_EDGE_PADDING, animated: true });

    radarTimersRef.current = [
      setTimeout(() => {
        mapRef.current?.animateCamera({ center, zoom: USER_FOCUS_ZOOM }, { duration: RADAR_ZOOM_BACK_MS });
      }, RADAR_ZOOM_OUT_MS + RADAR_REVEAL_MS),
      setTimeout(
        () => {
          acceptMovesAfterRef.current = Date.now() + CAMERA_SETTLE_MS;
          setRadarCards(null);
        },
        RADAR_ZOOM_OUT_MS + RADAR_REVEAL_MS + RADAR_ZOOM_BACK_MS,
      ),
    ];
  };

  const handleRadarSearch = async () => {
    if (radarLocked || radarSearching) return;
    setRadarSearching(true);
    try {
      const result = await radarScan();
      setRadarCooldownUntil(result.cooldownUntil);
      setNow(Date.now());
      revealRadar(result.cards);
    } catch (error) {
      const failure = error as RadarFailure;
      if (failure.cooldownUntil) {
        setRadarCooldownUntil(failure.cooldownUntil);
        setNow(Date.now());
      }
      toast.warning(t('radar.errorTitle'), t(`radar.errors.${failure.reason}`));
    } finally {
      setRadarSearching(false);
    }
  };

  const hint: ExplorerHintVariant | null =
    zoom === null ? null : !exploreOn ? 'zoomIn' : outOfEnergy ? 'noEnergy' : null;

  return {
    mapRef,
    onMapReady: () => setMapReady(true),
    handleRegionChangeComplete,
    radarLocked,
    coins,
    batteries,
    /** Cartas no mapa: todas da sala durante o radar; fora dele, só as da célula res 9 do jogador. */
    mapCards: radarCards ?? visibleCards,
    discoveryFlags,
    otherUsers,
    playerPosition,
    avatarUri: resolveApiUri(user?.avatar),
    avatarName: user?.username ?? session?.username,
    focusCount,
    energy,
    maxEnergy,
    level,
    xp,
    balance: wallet?.balance ?? 0,
    lastCoinGain,
    hint,
    placeName,
    difficulty: MOCK_ZONE.difficulty,
    // Painel: com o Explore desligado, os dados da sala aparecem como "—".
    dashboardNearby: exploreOn ? nearbyCount : null,
    dashboardCards: exploreOn && connected ? cards.length : null,
    dashboardFlagOwner: exploreOn ? flagOwnerName : undefined,
    distanceKm,
    exploreOn,
    xpProgress,
    radarSearching,
    canRadar: exploreOn && connected && !radarLocked && energy >= (maxEnergy * RADAR_COST_PERCENT) / 100,
    radarCooldownSeconds,
    handleRadarSearch,
    refuelOpen,
    openRefuel: () => setRefuelOpen(true),
    closeRefuel: () => setRefuelOpen(false),
    fillTankPrice,
    roomConnected: exploreOn && connected,
    purchaseFuel,
    // O pack não abre por cima do "Abastecer".
    visiblePack: refuelOpen ? null : cardsPack,
    dismissCardsPack,
  };
}

export type MapViewModel = ReturnType<typeof useMapViewModel>;

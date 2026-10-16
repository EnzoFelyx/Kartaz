import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import type MapView from 'react-native-maps';
import type { LatLng } from 'react-native-maps';

import type { RadarFailure } from '@/hooks/use-cell-room';
import type { CellCard } from '@/lib/colyseus/types';
import { getRoomBoundary } from '@/lib/h3/cells';
import { toast } from '@/lib/toast/toast-store';

import {
  CAMERA_SETTLE_MS,
  RADAR_EDGE_PADDING,
  RADAR_REVEAL_MS,
  RADAR_ZOOM_BACK_MS,
  RADAR_ZOOM_OUT_MS,
  USER_FOCUS_ZOOM,
} from './constants';
import type { MapRoomActionsRef } from './room-actions';

type MapRadarDeps = {
  mapRef: RefObject<MapView | null>;
  /** Até quando a câmera ignora movimentos (o radar segura enquanto mexe a câmera). */
  acceptMovesAfterRef: RefObject<number | null>;
  playerPositionRef: RefObject<LatLng | null>;
  roomActions: MapRoomActionsRef;
};

/**
 * Radar: o servidor cobra a energia e controla a espera; aceito, revela todas as cartas da sala
 * (trava a tela, afasta a câmera até a sala caber, mostra por 3 s e volta ao zoom do Explore).
 * Também conta a espera em segundos para o botão.
 */
export function useMapRadar({ mapRef, acceptMovesAfterRef, playerPositionRef, roomActions }: MapRadarDeps) {
  const { t } = useTranslation();
  const [searching, setSearching] = useState(false);
  /** Cartas reveladas pelo radar (todas da sala) enquanto a tela está travada; `null` fora do radar. */
  const [radarCards, setRadarCards] = useState<CellCard[] | null>(null);
  /** Até quando o radar fica em espera (ms, relógio do servidor ≈ aparelho). */
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const locked = radarCards !== null;

  // Sequência do radar (zoom out → cartas reveladas → volta): timers limpos ao sair da tela.
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

  // Contagem da espera do radar no botão (atualiza a cada segundo só enquanto há espera).
  useEffect(() => {
    if (cooldownUntil <= Date.now()) return;
    const interval = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= cooldownUntil) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownUntil]);

  const startCooldown = (until: number) => {
    setCooldownUntil(until);
    setNow(Date.now());
  };

  /** Revela as cartas: trava a tela, enquadra a sala (res 8), espera e volta ao jogador. */
  const reveal = (revealed: CellCard[]) => {
    const center = playerPositionRef.current;
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

    timersRef.current = [
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

  const scan = async () => {
    if (locked || searching) return;
    setSearching(true);
    try {
      const result = await roomActions.current.radarScan();
      startCooldown(result.cooldownUntil);
      reveal(result.cards);
    } catch (error) {
      const failure = error as RadarFailure;
      if (failure.cooldownUntil) startCooldown(failure.cooldownUntil);
      toast.warning(t('radar.errorTitle'), t(`radar.errors.${failure.reason}`));
    } finally {
      setSearching(false);
    }
  };

  return {
    searching,
    /** Cartas reveladas (todas da sala) durante o radar; `null` fora dele. */
    radarCards,
    /** Radar ativo: a tela fica travada e o Explore segue ligado mesmo com o zoom out. */
    locked,
    cooldownSeconds: Math.max(0, Math.ceil((cooldownUntil - now) / 1000)),
    scan,
  };
}

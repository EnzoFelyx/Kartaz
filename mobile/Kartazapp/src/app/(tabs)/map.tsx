import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import Animated, { Easing, withTiming, type EntryAnimationsValues } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FuelGauge } from '@/components/hud/fuel-gauge';
import { LevelCard } from '@/components/hud/level-card';
import { MapDashboard } from '@/components/map-dashboard';
import { MapGradientOverlay } from '@/components/map/map-gradient-overlay';
import { MapGridOverlay } from '@/components/map/map-grid-overlay';
import { TAB_BAR_BOTTOM_GAP, TAB_BAR_HEIGHT } from '@/components/tab-bar';
import { colors } from '@/theme/colors';
import { initialMapRegion, kartazMapStyle, mapViewConfig } from '@/theme/map-styles';

// Mock até termos a store do jogador (Fase 4 do todo).
const MOCK_PLAYER = { fuel: 78, maxFuel: 100, level: 12, xp: 2450 };
const MOCK_ZONE = {
  zone: 'South America',
  difficulty: 'medium' as const,
  discovered: 0,
  totalCards: 5,
  heat: 78,
  xpReward: 350,
  multiplier: 1.5,
};
/** Tempo da busca do radar (só visual, até a resposta vir do servidor). */
const MOCK_RADAR_SEARCH_MS = 1200;
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
  const [radarSearching, setRadarSearching] = useState(false);
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
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        customMapStyle={kartazMapStyle}
        initialRegion={initialMapRegion}
        {...mapViewConfig}
      />
      <MapGradientOverlay />
      <MapGridOverlay />

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
        {...MOCK_ZONE}
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

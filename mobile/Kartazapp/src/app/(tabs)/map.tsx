import { StyleSheet, View } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FuelGauge } from '@/components/hud/fuel-gauge';
import { LevelCard } from '@/components/hud/level-card';
import { MapGradientOverlay } from '@/components/map/map-gradient-overlay';
import { MapGridOverlay } from '@/components/map/map-grid-overlay';
import { colors } from '@/theme/colors';
import { initialMapRegion, kartazMapStyle, mapViewConfig } from '@/theme/map-styles';

// Mock até termos a store do jogador (Fase 4 do todo).
const MOCK_PLAYER = { fuel: 78, maxFuel: 100, level: 12, xp: 2450 };

export default function MapScreen() {
  const insets = useSafeAreaInsets();

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
      <View style={[styles.hudTop, { top: insets.top + 8 }]} pointerEvents="box-none">
        <FuelGauge
          fuel={MOCK_PLAYER.fuel}
          maxFuel={MOCK_PLAYER.maxFuel}
          style={styles.fuel}
        />
        <LevelCard level={MOCK_PLAYER.level} xp={MOCK_PLAYER.xp} />
      </View>
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
});

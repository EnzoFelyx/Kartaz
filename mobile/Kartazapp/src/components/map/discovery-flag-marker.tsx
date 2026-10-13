import { StyleSheet, View } from 'react-native';
import { Marker } from 'react-native-maps';
import Svg, { Path } from 'react-native-svg';

import { ActiveIndicatorRadar } from '@/components/tab-bar/active-indicator-radar';
import type { DiscoveryFlag } from '@/lib/colyseus/types';
import { colors } from '@/theme/colors';

const MARKER_SIZE = 44;
const FLAG_SIZE = 24;
/** Ciclo do radar (mais lento que o da tab bar, 2,6 s): pulsa calmo enquanto espera a coleta. */
const PULSE_MS = 3600;

type DiscoveryFlagMarkerProps = {
  flag: DiscoveryFlag;
  accessibilityLabel: string;
};

/**
 * Bandeira de descoberta no centro de uma área que ninguém coletou: só o ícone (mastro branco e
 * pano vermelho) com o mesmo radar azul da aba focada da tab bar, mais lento. Coletada quando a
 * foto do jogador fica embaixo dela (regra no servidor).
 */
export function DiscoveryFlagMarker({ flag, accessibilityLabel }: DiscoveryFlagMarkerProps) {
  return (
    <Marker
      coordinate={{ latitude: flag.lat, longitude: flag.lng }}
      anchor={{ x: 0.5, y: 0.5 }}
      // O radar é animado: o mapa precisa redesenhar o marcador a cada quadro.
      tracksViewChanges
      zIndex={1}
      accessibilityLabel={accessibilityLabel}>
      <View style={styles.container}>
        <ActiveIndicatorRadar color={colors.primary} size={MARKER_SIZE} duration={PULSE_MS} fillOpacity={0.35} />
        <Svg width={FLAG_SIZE} height={FLAG_SIZE} viewBox="0 0 24 24">
          {/* Pano vermelho. */}
          <Path d="M5 4s1.2-1 4-1 4.5 2 7.5 2S20 4 20 4v10s-1 1-3.5 1-4.5-2-7.5-2-4 1-4 1z" fill={colors.danger} />
          {/* Mastro branco. */}
          <Path d="M5 3v19" stroke={colors.white} strokeWidth={2.2} strokeLinecap="round" />
        </Svg>
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  container: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

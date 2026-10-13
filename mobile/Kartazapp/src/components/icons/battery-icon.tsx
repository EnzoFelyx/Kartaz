import Svg, { Path, Rect } from 'react-native-svg';

import { colors, withAlpha } from '@/theme/colors';

type BatteryIconProps = {
  size?: number;
};

/** Bateria do mapa (recarrega energia): corpo verde com polo e um raio no meio. */
export function BatteryIcon({ size = 22 }: BatteryIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {/* Polo positivo. */}
      <Rect x={9} y={1.5} width={6} height={2.5} rx={1} fill={colors.success} />
      {/* Corpo. */}
      <Rect
        x={5}
        y={3.5}
        width={14}
        height={19}
        rx={3}
        fill={withAlpha(colors.success, 0.25)}
        stroke={colors.success}
        strokeWidth={2}
      />
      {/* Raio (energia). */}
      <Path d="M13 7l-4 6.5h3L11 19l4-6.5h-3z" fill={colors.gold} />
    </Svg>
  );
}

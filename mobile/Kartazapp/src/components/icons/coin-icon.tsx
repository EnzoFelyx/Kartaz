import Svg, { Circle, Path } from 'react-native-svg';

import { colors, withAlpha } from '@/theme/colors';

type CoinIconProps = {
  size?: number;
};

/** Moeda dourada (mapa e HUD): disco com borda mais escura, aro interno e um brilho. */
export function CoinIcon({ size = 20 }: CoinIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={11} fill={colors.gold} stroke={colors.fuelEnd} strokeWidth={1.5} />
      <Circle cx={12} cy={12} r={7.5} fill="none" stroke={withAlpha(colors.fuelEnd, 0.7)} strokeWidth={1.5} />
      {/* Brilho no canto superior esquerdo. */}
      <Path
        d="M7 8.5a6 6 0 0 1 4-3"
        fill="none"
        stroke={withAlpha(colors.white, 0.75)}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

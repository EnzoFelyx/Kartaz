import type { ColorValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type SlidersIconProps = {
  color: ColorValue;
  size?: number;
};

/** Três barras horizontais com controles deslizantes (filtros). */
export function SlidersIcon({ color, size = 20 }: SlidersIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round">
      <Path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4" />
    </Svg>
  );
}

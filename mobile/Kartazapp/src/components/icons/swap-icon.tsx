import type { ColorValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type SwapIconProps = {
  color: ColorValue;
  size?: number;
};

/** Duas setas em sentidos opostos (troca). */
export function SwapIcon({ color, size = 18 }: SwapIconProps) {
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
      <Path d="m16 3 4 4-4 4" />
      <Path d="M20 7H4" />
      <Path d="m8 21-4-4 4-4" />
      <Path d="M4 17h16" />
    </Svg>
  );
}

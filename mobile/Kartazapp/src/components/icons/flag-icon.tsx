import type { ColorValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type FlagIconProps = {
  color: ColorValue;
  size?: number;
};

/** Bandeira (descoberta de uma área). */
export function FlagIcon({ color, size = 18 }: FlagIconProps) {
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
      <Path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <Path d="M4 22v-7" />
    </Svg>
  );
}

import type { ColorValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type ListIconProps = {
  color: ColorValue;
  size?: number;
};

export function ListIcon({ color, size = 18 }: ListIconProps) {
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
      <Path d="M8 6h13M8 12h13M8 18h13" />
      <Path d="M3 6h.01M3 12h.01M3 18h.01" />
    </Svg>
  );
}

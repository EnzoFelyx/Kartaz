import type { ColorValue } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

type MapPinIconProps = {
  color: ColorValue;
  size?: number;
};

export function MapPinIcon({ color, size = 14 }: MapPinIconProps) {
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
      <Path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
      <Circle cx={12} cy={10} r={3} />
    </Svg>
  );
}

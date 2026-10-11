import type { ColorValue } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

type CompassIconProps = {
  color: ColorValue;
  size?: number;
};

export function CompassIcon({ color, size = 14 }: CompassIconProps) {
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
      <Circle cx={12} cy={12} r={10} />
      <Path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36z" />
    </Svg>
  );
}

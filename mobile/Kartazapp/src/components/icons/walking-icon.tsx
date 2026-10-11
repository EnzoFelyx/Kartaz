import type { ColorValue } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

type WalkingIconProps = {
  color: ColorValue;
  size?: number;
};

export function WalkingIcon({ color, size = 14 }: WalkingIconProps) {
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
      <Circle cx={13} cy={4} r={2} />
      <Path d="M9 21l2.5-6.5" />
      <Path d="M14.5 21l-1.5-5-2.5-2.5 1-5" />
      <Path d="M7 12l2.5-3.5 3-.5 2.5 3 3 1" />
    </Svg>
  );
}

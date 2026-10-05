import type { ColorValue } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

type UserIconProps = {
  color: ColorValue;
  size?: number;
};

export function UserIcon({ color, size = 16 }: UserIconProps) {
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
      <Circle cx={12} cy={8} r={4} />
      <Path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
    </Svg>
  );
}

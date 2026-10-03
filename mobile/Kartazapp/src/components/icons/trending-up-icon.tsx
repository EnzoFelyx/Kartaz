import type { ColorValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type TrendingUpIconProps = {
  color: ColorValue;
  size?: number;
};

export function TrendingUpIcon({ color, size = 14 }: TrendingUpIconProps) {
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
      <Path d="m22 7-8.5 8.5-5-5L2 17" />
      <Path d="M16 7h6v6" />
    </Svg>
  );
}

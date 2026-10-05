import type { ColorValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type LayersIconProps = {
  color: ColorValue;
  size?: number;
};

export function LayersIcon({ color, size = 20 }: LayersIconProps) {
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
      <Path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z" />
      <Path d="m2 12 9.17 4.17a2 2 0 0 0 1.66 0L22 12" />
      <Path d="m2 17 9.17 4.17a2 2 0 0 0 1.66 0L22 17" />
    </Svg>
  );
}

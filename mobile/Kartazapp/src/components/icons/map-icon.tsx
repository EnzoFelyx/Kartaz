import type { ColorValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type MapIconProps = {
  color: ColorValue;
  size?: number;
};

export function MapIcon({ color, size = 14 }: MapIconProps) {
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
      <Path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z" />
      <Path d="M9 3v15" />
      <Path d="M15 6v15" />
    </Svg>
  );
}

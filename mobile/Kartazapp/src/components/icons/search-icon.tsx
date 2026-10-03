import type { ColorValue } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

type SearchIconProps = {
  color: ColorValue;
  size?: number;
};

export function SearchIcon({ color, size = 18 }: SearchIconProps) {
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
      <Circle cx={11} cy={11} r={8} />
      <Path d="m21 21-4.3-4.3" />
    </Svg>
  );
}

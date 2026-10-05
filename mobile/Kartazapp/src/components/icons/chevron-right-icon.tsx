import type { ColorValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type ChevronRightIconProps = {
  color: ColorValue;
  size?: number;
};

export function ChevronRightIcon({ color, size = 18 }: ChevronRightIconProps) {
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
      <Path d="m9 18 6-6-6-6" />
    </Svg>
  );
}

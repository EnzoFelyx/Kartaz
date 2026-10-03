import type { ColorValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type ArrowLeftIconProps = {
  color: ColorValue;
  size?: number;
};

export function ArrowLeftIcon({ color, size = 20 }: ArrowLeftIconProps) {
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
      <Path d="M19 12H5M12 19l-7-7 7-7" />
    </Svg>
  );
}

import type { ColorValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type MessageCircleIconProps = {
  color: ColorValue;
  size?: number;
};

export function MessageCircleIcon({ color, size = 16 }: MessageCircleIconProps) {
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
      <Path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z" />
    </Svg>
  );
}

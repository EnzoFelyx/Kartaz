import type { ColorValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type ActivityIconProps = {
  color: ColorValue;
  size?: number;
};

export function ActivityIcon({ color, size = 20 }: ActivityIconProps) {
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
      <Path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </Svg>
  );
}

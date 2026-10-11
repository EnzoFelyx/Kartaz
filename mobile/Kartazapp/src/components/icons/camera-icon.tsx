import type { ColorValue } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

type CameraIconProps = {
  color: ColorValue;
  size?: number;
};

export function CameraIcon({ color, size = 20 }: CameraIconProps) {
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
      <Path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <Circle cx={12} cy={13} r={3} />
    </Svg>
  );
}

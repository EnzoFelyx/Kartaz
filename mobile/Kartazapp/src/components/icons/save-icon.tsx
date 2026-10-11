import type { ColorValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type SaveIconProps = {
  color: ColorValue;
  size?: number;
};

export function SaveIcon({ color, size = 20 }: SaveIconProps) {
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
      <Path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <Path d="M17 21v-8H7v8" />
      <Path d="M7 3v5h8" />
    </Svg>
  );
}

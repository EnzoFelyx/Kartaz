import type { ColorValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type CloseIconProps = {
  color: ColorValue;
  size?: number;
};

export function CloseIcon({ color, size = 18 }: CloseIconProps) {
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
      <Path d="M18 6 6 18M6 6l12 12" />
    </Svg>
  );
}

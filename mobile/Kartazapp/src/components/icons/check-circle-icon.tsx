import type { ColorValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type CheckCircleIconProps = {
  color: ColorValue;
  size?: number;
};

/** Círculo com check (sucesso). */
export function CheckCircleIcon({ color, size = 18 }: CheckCircleIconProps) {
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
      <Path d="M21.8 10A10 10 0 1 1 17 3.34" />
      <Path d="m9 11 3 3L22 4" />
    </Svg>
  );
}

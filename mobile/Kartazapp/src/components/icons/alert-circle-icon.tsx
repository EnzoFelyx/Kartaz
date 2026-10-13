import type { ColorValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type AlertCircleIconProps = {
  color: ColorValue;
  size?: number;
};

/** Círculo com exclamação (erro). */
export function AlertCircleIcon({ color, size = 18 }: AlertCircleIconProps) {
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
      <Path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z" />
      <Path d="M12 8v4" />
      <Path d="M12 16h.01" />
    </Svg>
  );
}

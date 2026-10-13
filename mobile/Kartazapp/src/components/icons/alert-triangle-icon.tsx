import type { ColorValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type AlertTriangleIconProps = {
  color: ColorValue;
  size?: number;
};

/** Triângulo com exclamação (aviso). */
export function AlertTriangleIcon({ color, size = 18 }: AlertTriangleIconProps) {
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
      <Path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <Path d="M12 9v4" />
      <Path d="M12 17h.01" />
    </Svg>
  );
}

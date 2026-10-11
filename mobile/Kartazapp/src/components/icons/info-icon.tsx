import type { ColorValue } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

type InfoIconProps = {
  color: ColorValue;
  size?: number;
};

export function InfoIcon({ color, size = 14 }: InfoIconProps) {
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
      <Circle cx={12} cy={12} r={10} />
      <Path d="M12 16v-4" />
      <Path d="M12 8h.01" />
    </Svg>
  );
}

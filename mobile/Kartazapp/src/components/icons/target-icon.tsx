import type { ColorValue } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

type TargetIconProps = {
  color: ColorValue;
  size?: number;
};

export function TargetIcon({ color, size = 14 }: TargetIconProps) {
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
      <Circle cx={12} cy={12} r={6} />
      <Circle cx={12} cy={12} r={2} />
    </Svg>
  );
}

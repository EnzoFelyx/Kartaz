import type { ColorValue } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

type ShareIconProps = {
  color: ColorValue;
  size?: number;
};

export function ShareIcon({ color, size = 20 }: ShareIconProps) {
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
      <Circle cx={18} cy={5} r={3} />
      <Circle cx={6} cy={12} r={3} />
      <Circle cx={18} cy={19} r={3} />
      <Path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98" />
    </Svg>
  );
}

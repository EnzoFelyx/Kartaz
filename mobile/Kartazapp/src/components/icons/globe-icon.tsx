import type { ColorValue } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

type GlobeIconProps = {
  color: ColorValue;
  size?: number;
};

export function GlobeIcon({ color, size = 18 }: GlobeIconProps) {
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
      <Path d="M2 12h20" />
      <Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </Svg>
  );
}

import type { ColorValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type ShieldIconProps = {
  color: ColorValue;
  size?: number;
};

export function ShieldIcon({ color, size = 20 }: ShieldIconProps) {
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
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </Svg>
  );
}

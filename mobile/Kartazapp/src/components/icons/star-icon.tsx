import type { ColorValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type StarIconProps = {
  color: ColorValue;
  size?: number;
};

export function StarIcon({ color, size = 18 }: StarIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round">
      <Path d="M12 2.5l2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.52l-5.88 3.09 1.12-6.55L2.48 9.42l6.58-.96z" />
    </Svg>
  );
}

import type { ColorValue } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

type HelpCircleIconProps = {
  color: ColorValue;
  size?: number;
};

/** Ponto de interrogação num círculo (ajuda / regras). */
export function HelpCircleIcon({ color, size = 20 }: HelpCircleIconProps) {
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
      <Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
    </Svg>
  );
}

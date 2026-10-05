import type { ColorValue } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

type CalendarIconProps = {
  color: ColorValue;
  size?: number;
};

export function CalendarIcon({ color, size = 16 }: CalendarIconProps) {
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
      <Rect x={3} y={4} width={18} height={18} rx={2} />
      <Path d="M16 2v4M8 2v4M3 10h18" />
    </Svg>
  );
}

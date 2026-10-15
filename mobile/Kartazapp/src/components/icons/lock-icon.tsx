import type { ColorValue } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

type LockIconProps = {
  color: ColorValue;
  size?: number;
};

/** Cadeado fechado (conquista bloqueada). */
export function LockIcon({ color, size = 20 }: LockIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={4} y={11} width={16} height={10} rx={2} fill={color} />
      <Path d="M8 11V7a4 4 0 0 1 8 0v4" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}

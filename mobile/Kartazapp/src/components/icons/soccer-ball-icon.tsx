import type { ColorValue } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

type SoccerBallIconProps = {
  color: ColorValue;
  size?: number;
  strokeWidth?: number;
};

/** Bola de futebol em contorno: pentágono no centro com as costuras indo até a borda. */
export function SoccerBallIcon({ color, size = 20, strokeWidth = 1.5 }: SoccerBallIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round">
      <Circle cx={12} cy={12} r={9} />
      <Path d="M12 7l4.76 3.45-1.76 5.55h-6l-1.76-5.55z" />
      <Path d="M12 7V3M15 16l2.5 3M16.76 10.45l3.74-1.45M9 16l-2.5 3M7.24 10.45L3.5 9" />
    </Svg>
  );
}

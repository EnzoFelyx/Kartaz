import type { ColorValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type SparklesIconProps = {
  color: ColorValue;
  size?: number;
};

/** Brilhos (ação automática / "mágica"). */
export function SparklesIcon({ color, size = 18 }: SparklesIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round">
      <Path
        d="M9.94 14.06 8 20l-1.94-5.94L0 12l6.06-1.94L8 4l1.94 6.06L16 12l-6.06 2.06z"
        transform="translate(2 0) scale(0.9)"
      />
      <Path d="M19 3v4M17 5h4M20 15v4M18 17h4" />
    </Svg>
  );
}

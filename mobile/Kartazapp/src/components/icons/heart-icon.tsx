import type { ColorValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type HeartIconProps = {
  color: ColorValue;
  size?: number;
  /** Preenchido quando ativo (ex.: favoritado). */
  filled?: boolean;
};

export function HeartIcon({ color, size = 20, filled = false }: HeartIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? color : 'none'}
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round">
      <Path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z" />
    </Svg>
  );
}

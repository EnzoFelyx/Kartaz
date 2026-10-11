import type { ColorValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type MailIconProps = {
  color: ColorValue;
  size?: number;
};

export function MailIcon({ color, size = 20 }: MailIconProps) {
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
      <Path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
      <Path d="M22 6l-10 7L2 6" />
    </Svg>
  );
}

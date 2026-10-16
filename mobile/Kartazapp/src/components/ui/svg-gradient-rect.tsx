import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

type SvgGradientRectProps = {
  /** Id do gradiente (único dentro do mesmo SVG pai; pode repetir entre componentes). */
  id: string;
  /** Cores do gradiente, distribuídas por igual. */
  colors: readonly string[];
  /** `diagonal`: canto superior esquerdo → inferior direito. `horizontal`: esquerda → direita. */
  direction?: 'diagonal' | 'horizontal';
  radius?: number;
  /** Tamanho em pontos ou em % (padrão: ocupa o pai inteiro). */
  width?: number | `${number}%`;
  height?: number | `${number}%`;
  style?: StyleProp<ViewStyle>;
};

/**
 * Retângulo (arredondado) preenchido com gradiente, em SVG: mais leve que um Canvas Skia por item e
 * funciona dentro de views animadas (bordas das cartas, preenchimento do slider).
 */
export function SvgGradientRect({
  id,
  colors,
  direction = 'diagonal',
  radius = 0,
  width = '100%',
  height = '100%',
  style = StyleSheet.absoluteFill,
}: SvgGradientRectProps) {
  const last = Math.max(colors.length - 1, 1);
  return (
    <Svg style={style} width={width} height={height} preserveAspectRatio="none">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2={direction === 'diagonal' ? '1' : '0'}>
          {colors.map((color, index) => (
            <Stop key={`${index}-${color}`} offset={index / last} stopColor={color} />
          ))}
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} rx={radius} fill={`url(#${id})`} />
    </Svg>
  );
}

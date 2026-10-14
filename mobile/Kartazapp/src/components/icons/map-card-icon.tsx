import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

import { colors, withAlpha } from '@/theme/colors';

/** Proporção da carta (altura / largura), a mesma da carta revelada no pack. */
export const MAP_CARD_ASPECT = 1.4;

/** Carta desenhada em 20×28; o viewBox tem margem para ela girar (balanço) sem ser cortada. */
const VIEW_BOX = { x: -4, y: -3, width: 28, height: 34 };
const CARD_CENTER = { x: 10, y: 14 };

type MapCardIconProps = {
  /** Altura da carta (sem a margem do balanço). */
  height?: number;
  /** Inclinação da carta em graus (o marcador do mapa muda para o balanço). */
  rotation?: number;
};

/** Tamanho total do ícone (carta + margem do balanço) para uma carta de `height`. */
export function mapCardIconSize(height: number) {
  const scale = height / 28;
  return { width: VIEW_BOX.width * scale, height: VIEW_BOX.height * scale };
}

/**
 * Carta virada para baixo no mapa: miniatura das costas da carta do pack (`CardReveal`) — contorno
 * azul-claro, fundo escuro e a bola de futebol no meio. Não mostra quem é o jogador.
 * A inclinação é feita dentro do SVG (não girando a view): o mapa desenha o marcador como imagem,
 * e com a view girada a carta sumia. Vem como prop comum (re-render), não animação do Reanimated:
 * o mapa só redesenha o marcador quando o React atualiza o SVG.
 */
export function MapCardIcon({ height = 34, rotation = 0 }: MapCardIconProps) {
  const size = mapCardIconSize(height);

  return (
    <Svg
      width={size.width}
      height={size.height}
      viewBox={`${VIEW_BOX.x} ${VIEW_BOX.y} ${VIEW_BOX.width} ${VIEW_BOX.height}`}>
      <G rotation={rotation} originX={CARD_CENTER.x} originY={CARD_CENTER.y}>
        <Rect
          x={0.75}
          y={0.75}
          width={18.5}
          height={26.5}
          rx={3.5}
          fill={colors.card}
          stroke={colors.primarySoft}
          strokeWidth={1.5}
        />
        {/* Brilho sutil no topo, como a luz batendo na carta. */}
        <Rect x={2.5} y={2.5} width={15} height={8} rx={2} fill={withAlpha(colors.primarySoft, 0.08)} />
        {/* Bola de futebol (mesmo desenho do SoccerBallIcon), centralizada em 12×12. */}
        <G
          transform="translate(4 8) scale(0.5)"
          fill="none"
          stroke={colors.primarySoft}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round">
          <Circle cx={12} cy={12} r={9} />
          <Path d="M12 7l4.76 3.45-1.76 5.55h-6l-1.76-5.55z" />
          <Path d="M12 7V3M15 16l2.5 3M16.76 10.45l3.74-1.45M9 16l-2.5 3M7.24 10.45L3.5 9" />
        </G>
      </G>
    </Svg>
  );
}

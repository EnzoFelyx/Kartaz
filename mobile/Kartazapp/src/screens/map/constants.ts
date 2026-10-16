/** Explore Mode liga a partir deste zoom (nível de ruas). */
export const EXPLORE_MIN_ZOOM = 18;
/** Zoom da câmera ao focar no jogador: já começa com o Explore Mode ligado. */
export const USER_FOCUS_ZOOM = 18;
/** Folga do arredondamento ao comparar o zoom calculado com o limite (ex.: 17,999 conta como 18). */
export const ZOOM_EPSILON = 0.05;
export const USER_FOCUS_MS = 1000;
/** Animação de volta quando o movimento é bloqueado (sem energia). */
export const SNAP_BACK_MS = 400;
/** Margem depois de uma animação da câmera: o `onRegionChangeComplete` dela não é movimento do jogador. */
export const CAMERA_SETTLE_MS = 400;
/** Movimentos menores que isso (graus) são ruído do mapa, não arrasto. */
export const MOVE_EPSILON_DEG = 1e-6;

/** Energia máxima padrão (antes de a sala responder). */
export const DEFAULT_MAX_ENERGY = 100;

/** Radar: energia gasta por uso (% da máxima; quem cobra é o servidor) e a sequência da câmera. */
export const RADAR_COST_PERCENT = 10;
/** Zoom out até enquadrar a sala inteira. */
export const RADAR_ZOOM_OUT_MS = 800;
/** Tempo com as cartas reveladas (tela travada). */
export const RADAR_REVEAL_MS = 3000;
/** Volta ao zoom do Explore, no jogador. */
export const RADAR_ZOOM_BACK_MS = 800;
/** Folga nas bordas ao enquadrar a sala (o painel de baixo ocupa espaço). */
export const RADAR_EDGE_PADDING = { top: 160, right: 48, bottom: 300, left: 48 };

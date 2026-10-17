import baseColors from './base-colors.json';

/**
 * Paleta principal — tokens do `@theme` de UI_REACT_para_referencia/src/index.css.
 * Fonte única de cores do app (será lida pelo tailwind.config na Fase 1).
 */
export const colors = {
  /** Também usada no app.config (splash e ícone do Android): por isso fica em `base-colors.json`. */
  background: baseColors.background,
  foreground: '#e8eaf0',
  card: '#0f1520',
  cardForeground: '#e8eaf0',
  primary: '#00d4ff',
  primarySoft: '#7eeeff',
  primaryForeground: '#080b14',
  secondary: '#1a2235',
  secondaryForeground: '#a0aec0',
  muted: '#111827',
  mutedForeground: '#6b7280',
  accent: '#ff6b00',
  accentForeground: '#ffffff',
  border: 'rgba(0, 212, 255, 0.12)',
  ring: '#00d4ff',

  // neutros
  white: '#ffffff',
  /** Cor das sombras (shadowColor). */
  shadow: '#000000',
  transparent: 'transparent',

  // complementares usadas no protótipo
  deep: '#040710',
  subtle: '#4b5563',
  violet: '#8b5cf6',
  magenta: '#d946ef',
  gold: '#ffd700',
  success: '#22c55e',
  danger: '#ef4444',
  info: '#3b82f6',
  fuelEnd: '#ffaa00',
  progressEnd: '#0088ff',
  /** Gradiente diagonal do selo de overall (OVR): azul aço (sup. esq.) → azul profundo (inf. dir.). */
  overallTop: '#4f88b6',
  overallBottom: '#2a58a3',
  glass: 'rgba(15, 21, 32, 0.85)',
  track: 'rgba(255, 255, 255, 0.08)',
  tabBarFallback: 'rgba(15, 21, 32, 0.92)',
  /** Faixa de luz que percorre barras de progresso (pulso) e bordas (shimmer). */
  highlight: 'rgba(255, 255, 255, 0.85)',
} as const;

export type ColorToken = keyof typeof colors;

/** Aplica transparência a uma cor hex do tema (#rrggbb) → `rgba(r, g, b, alpha)`. */
export function withAlpha(hex: string, alpha: number) {
  const value = parseInt(hex.replace('#', ''), 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

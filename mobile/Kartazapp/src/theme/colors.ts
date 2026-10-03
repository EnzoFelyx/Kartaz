/**
 * Paleta principal — tokens do `@theme` de UI_REACT_para_referencia/src/index.css.
 * Fonte única de cores do app (será lida pelo tailwind.config na Fase 1).
 */
export const colors = {
  background: '#080b14',
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
  transparent: 'transparent',

  // complementares usadas no protótipo
  deep: '#040710',
  subtle: '#4b5563',
  violet: '#8b5cf6',
  magenta: '#d946ef',
  gold: '#ffd700',
  fuelEnd: '#ffaa00',
  progressEnd: '#0088ff',
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

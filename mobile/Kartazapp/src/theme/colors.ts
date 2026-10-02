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
  primaryForeground: '#080b14',
  secondary: '#1a2235',
  secondaryForeground: '#a0aec0',
  muted: '#111827',
  mutedForeground: '#6b7280',
  accent: '#ff6b00',
  accentForeground: '#ffffff',
  border: 'rgba(0, 212, 255, 0.12)',
  ring: '#00d4ff',

  // complementares usadas no protótipo
  deep: '#040710',
  subtle: '#4b5563',
  tabBarFallback: 'rgba(15, 21, 32, 0.92)',
} as const;

export type ColorToken = keyof typeof colors;

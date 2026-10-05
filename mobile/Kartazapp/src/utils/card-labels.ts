import i18n, { getLocaleTag } from '@/i18n';
import type { CityId, NationCode, Position } from '@/types/player-card';

/** Papel exibido para cada posição (chave de tradução em `roles`). */
export const ROLE_BY_POSITION: Record<Position, 'goalkeeper' | 'defender' | 'midfielder' | 'forward'> = {
  GK: 'goalkeeper',
  CB: 'defender',
  LB: 'defender',
  RB: 'defender',
  CDM: 'midfielder',
  CM: 'midfielder',
  CAM: 'midfielder',
  LW: 'forward',
  RW: 'forward',
  ST: 'forward',
};

/** Data curta no idioma atual (ex.: "14 Oct 2025" / "14 de out. de 2025"). */
export function formatShortDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(getLocaleTag(), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Número com separador de milhar do idioma atual (ex.: 1,000 / 1.000). */
export function formatNumber(value: number) {
  return value.toLocaleString(getLocaleTag());
}

/** Nome da seleção no idioma atual (ex.: BRA → "Brasil"). */
export function getNationName(code: NationCode) {
  return i18n.t(`nations.${code}`);
}

/** Local de coleta no idioma atual (ex.: "Munique, Alemanha"). */
export function formatLocation(location: { city: CityId; nationCode: NationCode }) {
  return i18n.t('common.location', {
    city: i18n.t(`cities.${location.city}`),
    nation: getNationName(location.nationCode),
  });
}

/** Comparação alfabética no idioma atual. */
export function compareLocale(a: string, b: string) {
  return a.localeCompare(b, getLocaleTag());
}

/** Sigla da posição no idioma atual (ex.: ST → "ATA"). */
export function getPositionLabel(position: Position) {
  return i18n.t(`positions.${position}`);
}

/** Nome completo da posição no idioma atual (ex.: ST → "Centroavante"). */
export function getPositionName(position: Position) {
  return i18n.t(`positionNames.${position}`);
}

/** Porcentagem no idioma atual, com até 1 casa decimal (ex.: 0.001 → "0,1%"). */
export function formatPercent(ratio: number) {
  return ratio.toLocaleString(getLocaleTag(), { style: 'percent', maximumFractionDigits: 1 });
}

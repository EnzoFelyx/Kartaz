import i18n, { getLocaleTag } from '@/i18n';
import en from '@/i18n/locales/en.json';
import es from '@/i18n/locales/es.json';
import pt from '@/i18n/locales/pt.json';
import type { FoundLocation, KnownPosition, NationCode } from '@/types/player-card';

export type Role = 'goalkeeper' | 'defender' | 'midfielder' | 'forward';

/** Papel exibido para cada posição (chave de tradução em `roles`). */
const ROLE_BY_POSITION: Record<KnownPosition, Role> = {
  GK: 'goalkeeper',
  CB: 'defender',
  LB: 'defender',
  RB: 'defender',
  CDM: 'midfielder',
  CM: 'midfielder',
  CAM: 'midfielder',
  LM: 'midfielder',
  RM: 'midfielder',
  LW: 'forward',
  RW: 'forward',
  ST: 'forward',
};

function isKnownPosition(position: string): position is KnownPosition {
  return position in en.positions;
}

/** Papel da posição (ex.: ST → forward). Posições desconhecidas contam como meio-campo. */
export function getRole(position: string): Role {
  return isKnownPosition(position) ? ROLE_BY_POSITION[position] : 'midfielder';
}

/**
 * Formatadores `Intl` por idioma, criados uma vez só. `toLocaleString`/`localeCompare` com locale
 * criam um formatador novo a cada chamada, o que é caro no Hermes (várias chamadas por card).
 */
const formatters = new Map<
  string,
  {
    number: Intl.NumberFormat;
    decimal: Intl.NumberFormat;
    percent: Intl.NumberFormat;
    shortDate: Intl.DateTimeFormat;
    collator: Intl.Collator;
  }
>();

function getFormatters() {
  const locale = getLocaleTag();
  let cached = formatters.get(locale);
  if (!cached) {
    cached = {
      number: new Intl.NumberFormat(locale),
      decimal: new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      percent: new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 }),
      shortDate: new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric' }),
      collator: new Intl.Collator(locale),
    };
    formatters.set(locale, cached);
  }
  return cached;
}

/** Data curta no idioma atual (ex.: "14 Oct 2025" / "14 de out. de 2025"). Aceita `YYYY-MM-DD` ou ISO completo. */
export function formatShortDate(iso: string) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T00:00:00`) : new Date(iso);
  return getFormatters().shortDate.format(date);
}

/** Número com separador de milhar do idioma atual (ex.: 1,000 / 1.000). */
export function formatNumber(value: number) {
  return getFormatters().number.format(value);
}

/** Número com 2 casas decimais no idioma atual (ex.: 4.47 / 4,47). */
export function formatDecimal(value: number) {
  return getFormatters().decimal.format(value);
}

/** Nome (em inglês, como vem do backend) → código da seleção com tradução no i18n. */
const NATION_CODE_BY_NAME = new Map<string, NationCode>([
  ...(Object.entries(en.nations) as [NationCode, string][]).map(([code, name]) => [name.toLowerCase(), code] as const),
  // Nomes usados na base de jogadores que diferem do i18n.
  ['holland', 'NED'],
  ['korea republic', 'KOR'],
]);

/**
 * Nome da seleção no idioma atual. Aceita o código (BRA) ou o nome do backend ("Brazil");
 * seleções sem tradução aparecem com o nome original.
 */
export function getNationName(nation: string) {
  const value = nation.trim();
  const code = value in en.nations ? (value as NationCode) : NATION_CODE_BY_NAME.get(value.toLowerCase());
  return code ? i18n.t(`nations.${code}`) : value;
}

/** Sigla curta da seleção para a arte da carta (ex.: "Brazil" → BRA, "Norway" → NOR). */
export function getNationShortCode(nation: string) {
  const value = nation.trim();
  if (value in en.nations) return value;
  return NATION_CODE_BY_NAME.get(value.toLowerCase()) ?? value.slice(0, 3).toUpperCase();
}

/**
 * Local de coleta (ex.: "Munique, Baviera"). Sem cidade/estado, as coordenadas (ex.: "-19.9139, -43.9273");
 * sem nada conhecido, devolve "—".
 */
export function formatLocation(location: FoundLocation) {
  const parts = [location.city, location.state].filter((part): part is string => !!part?.trim());
  if (parts.length > 0) return parts.join(', ');
  const { lat, lng } = location;
  if (Number.isFinite(lat) && Number.isFinite(lng)) return `${lat!.toFixed(4)}, ${lng!.toFixed(4)}`;
  return '—';
}

/** Nomes da seleção em qualquer idioma do app (e o código) → código. Para filtros digitados pelo usuário. */
const NATION_CODE_BY_ANY_NAME = new Map<string, NationCode>([
  ...NATION_CODE_BY_NAME,
  ...[pt.nations, es.nations].flatMap((names) =>
    (Object.entries(names) as [NationCode, string][]).map(([code, name]) => [name.toLowerCase(), code] as const),
  ),
  ...(Object.keys(en.nations) as NationCode[]).map((code) => [code.toLowerCase(), code] as const),
]);

/** Nomes da base de jogadores que diferem do i18n (o filtro manda os dois). */
const BACKEND_NATION_ALIASES: Partial<Record<NationCode, string[]>> = {
  NED: ['Holland'],
  KOR: ['Korea Republic'],
};

/**
 * Filtro de seleção digitado ("BRA, Argentina, Espanha") → nomes como estão no backend, em inglês
 * ("Brazil,Argentina,Spain"). O que não for reconhecido vai como foi digitado.
 */
export function toBackendNationFilter(input: string) {
  const names = input
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .flatMap((part) => {
      const code = NATION_CODE_BY_ANY_NAME.get(part.toLowerCase());
      return code ? [en.nations[code], ...(BACKEND_NATION_ALIASES[code] ?? [])] : [part];
    });
  return [...new Set(names)].join(',');
}

/** Comparação alfabética no idioma atual. */
export function compareLocale(a: string, b: string) {
  return getFormatters().collator.compare(a, b);
}

/** Sigla da posição no idioma atual (ex.: ST → "ATA"). */
export function getPositionLabel(position: string) {
  return isKnownPosition(position) ? i18n.t(`positions.${position}`) : position;
}

/** Nome completo da posição no idioma atual (ex.: ST → "Centroavante"). */
export function getPositionName(position: string) {
  return isKnownPosition(position) ? i18n.t(`positionNames.${position}`) : position;
}

/** Porcentagem no idioma atual, com até 1 casa decimal (ex.: 0.001 → "0,1%"). */
export function formatPercent(ratio: number) {
  return getFormatters().percent.format(ratio);
}

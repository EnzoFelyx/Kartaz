/**
 * Seleções para a lista demonstrativa da aba Cards (sem backend por enquanto).
 * Ordenadas alfabeticamente (no idioma atual) por quem consome a lista.
 */
import type { NationCode } from '@/types/player-card';

/** O nome traduzido vem de `getNationName(code)`. */
export type Nation = {
  code: NationCode;
};

export const MOCK_NATIONS: Nation[] = [
  { code: 'ARG' },
  { code: 'AUS' },
  { code: 'BEL' },
  { code: 'BRA' },
  { code: 'CAN' },
  { code: 'COL' },
  { code: 'CRO' },
  { code: 'ENG' },
  { code: 'FRA' },
  { code: 'GER' },
  { code: 'JPN' },
  { code: 'KOR' },
  { code: 'MAR' },
  { code: 'MEX' },
  { code: 'NED' },
  { code: 'NGA' },
  { code: 'POR' },
  { code: 'SEN' },
  { code: 'ESP' },
  { code: 'URU' },
  { code: 'USA' },
];

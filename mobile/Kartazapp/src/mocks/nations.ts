/**
 * Seleções para a lista demonstrativa da aba Cards (sem backend por enquanto).
 * Ordenadas alfabeticamente por quem consome a lista.
 */
export type Nation = {
  code: string;
  name: string;
};

export const MOCK_NATIONS: Nation[] = [
  { code: 'ARG', name: 'Argentina' },
  { code: 'AUS', name: 'Australia' },
  { code: 'BEL', name: 'Belgium' },
  { code: 'BRA', name: 'Brazil' },
  { code: 'CAN', name: 'Canada' },
  { code: 'COL', name: 'Colombia' },
  { code: 'CRO', name: 'Croatia' },
  { code: 'ENG', name: 'England' },
  { code: 'FRA', name: 'France' },
  { code: 'GER', name: 'Germany' },
  { code: 'JPN', name: 'Japan' },
  { code: 'KOR', name: 'South Korea' },
  { code: 'MAR', name: 'Morocco' },
  { code: 'MEX', name: 'Mexico' },
  { code: 'NED', name: 'Netherlands' },
  { code: 'NGA', name: 'Nigeria' },
  { code: 'POR', name: 'Portugal' },
  { code: 'SEN', name: 'Senegal' },
  { code: 'ESP', name: 'Spain' },
  { code: 'URU', name: 'Uruguay' },
  { code: 'USA', name: 'United States' },
];

import type { PlayerCard } from '@/types/player-card';

/**
 * Cartas mockadas da coleção do jogador (sem backend por enquanto).
 * Nomes fictícios: não usamos nomes/imagens reais de jogadores (licenciamento).
 */
export const MOCK_PLAYER_CARDS: PlayerCard[] = [
  { id: 'c01', name: 'Rafael Moura', nationCode: 'BRA', position: 'LW', rating: 92, rarity: 'legendary', serial: 400, maxSerial: 1000, copiesFound: 1, totalCopies: 1000, collectedAt: '2026-09-28', collectedLocation: { city: 'saoPaulo', nationCode: 'BRA' }, tradeOffers: 4, stats: { speed: 95, shooting: 89, passing: 91, dribbling: 96, defense: 62, physical: 78 } },
  { id: 'c02', name: 'Lucas Dumont', nationCode: 'FRA', position: 'ST', rating: 95, rarity: 'legendary', serial: 12, maxSerial: 1000, copiesFound: 3, totalCopies: 1000, collectedAt: '2026-09-30', collectedLocation: { city: 'paris', nationCode: 'FRA' }, tradeOffers: 2, stats: { speed: 97, shooting: 93, passing: 82, dribbling: 92, defense: 45, physical: 84 } },
  { id: 'c03', name: 'Mateo Ibarra', nationCode: 'ARG', position: 'CAM', rating: 94, rarity: 'legendary', serial: 731, maxSerial: 1000, copiesFound: 2, totalCopies: 1000, collectedAt: '2026-10-01', collectedLocation: { city: 'buenosAires', nationCode: 'ARG' }, tradeOffers: 6, stats: { speed: 84, shooting: 90, passing: 94, dribbling: 95, defense: 48, physical: 70 } },
  { id: 'c04', name: 'Jonas Becker', nationCode: 'GER', position: 'CM', rating: 91, rarity: 'epic', serial: 158, maxSerial: 1000, copiesFound: 14, totalCopies: 1000, collectedAt: '2026-09-21', collectedLocation: { city: 'munich', nationCode: 'GER' }, tradeOffers: 1, stats: { speed: 76, shooting: 82, passing: 92, dribbling: 85, defense: 78, physical: 80 } },
  { id: 'c05', name: 'Diego Navarro', nationCode: 'ESP', position: 'CB', rating: 89, rarity: 'epic', serial: 604, maxSerial: 1000, copiesFound: 21, totalCopies: 1000, collectedAt: '2026-09-25', collectedLocation: { city: 'madrid', nationCode: 'ESP' }, tradeOffers: 0, stats: { speed: 72, shooting: 55, passing: 78, dribbling: 70, defense: 91, physical: 88 } },
  { id: 'c06', name: 'Tiago Ferraz', nationCode: 'POR', position: 'RW', rating: 88, rarity: 'rare', serial: 287, maxSerial: 1000, copiesFound: 57, totalCopies: 1000, collectedAt: '2026-09-18', collectedLocation: { city: 'lisbon', nationCode: 'POR' }, tradeOffers: 3, stats: { speed: 91, shooting: 84, passing: 80, dribbling: 88, defense: 40, physical: 72 } },
  { id: 'c07', name: 'Kenji Arata', nationCode: 'JPN', position: 'CM', rating: 84, rarity: 'rare', serial: 915, maxSerial: 1000, copiesFound: 88, totalCopies: 1000, collectedAt: '2026-09-15', collectedLocation: { city: 'tokyo', nationCode: 'JPN' }, tradeOffers: 1, stats: { speed: 80, shooting: 72, passing: 86, dribbling: 84, defense: 66, physical: 68 } },
  { id: 'c08', name: 'Samuel Okafor', nationCode: 'NGA', position: 'ST', rating: 86, rarity: 'rare', serial: 43, maxSerial: 1000, copiesFound: 43, totalCopies: 1000, collectedAt: '2026-09-12', collectedLocation: { city: 'lagos', nationCode: 'NGA' }, tradeOffers: 2, stats: { speed: 88, shooting: 87, passing: 70, dribbling: 79, defense: 42, physical: 86 } },
  { id: 'c09', name: 'Ethan Clarke', nationCode: 'ENG', position: 'GK', rating: 80, rarity: 'common', serial: 522, maxSerial: 1000, copiesFound: 312, totalCopies: 1000, collectedAt: '2026-09-08', collectedLocation: { city: 'london', nationCode: 'ENG' }, tradeOffers: 0, stats: { speed: 58, shooting: 30, passing: 64, dribbling: 40, defense: 82, physical: 79 } },
  { id: 'c10', name: 'Luis Herrera', nationCode: 'MEX', position: 'LB', rating: 78, rarity: 'common', serial: 369, maxSerial: 1000, copiesFound: 274, totalCopies: 1000, collectedAt: '2026-09-05', collectedLocation: { city: 'mexicoCity', nationCode: 'MEX' }, tradeOffers: 1, stats: { speed: 83, shooting: 60, passing: 74, dribbling: 76, defense: 77, physical: 74 } },
];

export function getPlayerCardById(id: string) {
  return MOCK_PLAYER_CARDS.find((card) => card.id === id);
}

import type { PlayerCard } from '@/types/player-card';

/**
 * Cartas mockadas da coleção do jogador (sem backend por enquanto).
 * Nomes fictícios: não usamos nomes/imagens reais de jogadores (licenciamento).
 */
export const MOCK_PLAYER_CARDS: PlayerCard[] = [
  { id: 'c01', name: 'Rafael Moura', nation: 'Brazil', nationCode: 'BRA', position: 'LW', rating: 92, rarity: 'legendary', serial: 400, maxSerial: 1000, collectedAt: '2026-09-28', stats: { speed: 95, shooting: 89, passing: 91, dribbling: 96, defense: 62, physical: 78 } },
  { id: 'c02', name: 'Lucas Dumont', nation: 'France', nationCode: 'FRA', position: 'ST', rating: 95, rarity: 'legendary', serial: 12, maxSerial: 1000, collectedAt: '2026-09-30', stats: { speed: 97, shooting: 93, passing: 82, dribbling: 92, defense: 45, physical: 84 } },
  { id: 'c03', name: 'Mateo Ibarra', nation: 'Argentina', nationCode: 'ARG', position: 'CAM', rating: 94, rarity: 'legendary', serial: 731, maxSerial: 1000, collectedAt: '2026-10-01', stats: { speed: 84, shooting: 90, passing: 94, dribbling: 95, defense: 48, physical: 70 } },
  { id: 'c04', name: 'Jonas Becker', nation: 'Germany', nationCode: 'GER', position: 'CM', rating: 91, rarity: 'epic', serial: 158, maxSerial: 1000, collectedAt: '2026-09-21', stats: { speed: 76, shooting: 82, passing: 92, dribbling: 85, defense: 78, physical: 80 } },
  { id: 'c05', name: 'Diego Navarro', nation: 'Spain', nationCode: 'ESP', position: 'CB', rating: 89, rarity: 'epic', serial: 604, maxSerial: 1000, collectedAt: '2026-09-25', stats: { speed: 72, shooting: 55, passing: 78, dribbling: 70, defense: 91, physical: 88 } },
  { id: 'c06', name: 'Tiago Ferraz', nation: 'Portugal', nationCode: 'POR', position: 'RW', rating: 88, rarity: 'rare', serial: 287, maxSerial: 1000, collectedAt: '2026-09-18', stats: { speed: 91, shooting: 84, passing: 80, dribbling: 88, defense: 40, physical: 72 } },
  { id: 'c07', name: 'Kenji Arata', nation: 'Japan', nationCode: 'JPN', position: 'CM', rating: 84, rarity: 'rare', serial: 915, maxSerial: 1000, collectedAt: '2026-09-15', stats: { speed: 80, shooting: 72, passing: 86, dribbling: 84, defense: 66, physical: 68 } },
  { id: 'c08', name: 'Samuel Okafor', nation: 'Nigeria', nationCode: 'NGA', position: 'ST', rating: 86, rarity: 'rare', serial: 43, maxSerial: 1000, collectedAt: '2026-09-12', stats: { speed: 88, shooting: 87, passing: 70, dribbling: 79, defense: 42, physical: 86 } },
  { id: 'c09', name: 'Ethan Clarke', nation: 'England', nationCode: 'ENG', position: 'GK', rating: 80, rarity: 'common', serial: 522, maxSerial: 1000, collectedAt: '2026-09-08', stats: { speed: 58, shooting: 30, passing: 64, dribbling: 40, defense: 82, physical: 79 } },
  { id: 'c10', name: 'Luis Herrera', nation: 'Mexico', nationCode: 'MEX', position: 'LB', rating: 78, rarity: 'common', serial: 369, maxSerial: 1000, collectedAt: '2026-09-05', stats: { speed: 83, shooting: 60, passing: 74, dribbling: 76, defense: 77, physical: 74 } },
];

export function getPlayerCardById(id: string) {
  return MOCK_PLAYER_CARDS.find((card) => card.id === id);
}

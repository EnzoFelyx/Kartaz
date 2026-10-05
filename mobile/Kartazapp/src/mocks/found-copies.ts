import type { CityId, FoundCopy, NationCode, Player } from '@/types/player-card';

import { seeded } from './players';

/** Apelidos fictícios de outros jogadores. */
const OWNERS = ['Fan_99', 'GoalHunter', 'NightRunner', 'Rafa_10', 'PitchKing', 'SilverBoot', 'Ana.FC', 'Kenzo77', 'TurboLeo', 'MidfieldMax'];

const LOCATIONS: { city: CityId; nationCode: NationCode }[] = [
  { city: 'london', nationCode: 'ENG' },
  { city: 'saoPaulo', nationCode: 'BRA' },
  { city: 'paris', nationCode: 'FRA' },
  { city: 'munich', nationCode: 'GER' },
  { city: 'madrid', nationCode: 'ESP' },
  { city: 'tokyo', nationCode: 'JPN' },
  { city: 'buenosAires', nationCode: 'ARG' },
  { city: 'mexicoCity', nationCode: 'MEX' },
  { city: 'lisbon', nationCode: 'POR' },
  { city: 'lagos', nationCode: 'NGA' },
];

/** Máximo de cópias listadas no mock (o total real vem do servidor). */
const MAX_LISTED = 12;

/**
 * Cópias já encontradas de um jogador (mock determinístico, sem backend).
 * Ordenadas da mais recente para a mais antiga.
 */
export function getFoundCopies(player: Player): FoundCopy[] {
  const count = Math.min(player.copiesFound, MAX_LISTED);
  const usedSerials = new Set<number>();

  return Array.from({ length: count }, (_, index) => {
    const seed = `${player.id}-${index}`;
    let serial = 1 + Math.floor(seeded(seed, 1) * player.totalCopies);
    while (usedSerials.has(serial)) serial = (serial % player.totalCopies) + 1;
    usedSerials.add(serial);

    const month = 1 + Math.floor(seeded(seed, 2) * 9);
    const day = 1 + Math.floor(seeded(seed, 3) * 28);

    return {
      serial,
      maxSerial: player.totalCopies,
      owner: OWNERS[Math.floor(seeded(seed, 4) * OWNERS.length)],
      foundAt: `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      foundLocation: LOCATIONS[Math.floor(seeded(seed, 5) * LOCATIONS.length)],
      tradeOffers: Math.floor(seeded(seed, 6) * 7),
    };
  }).sort((a, b) => b.foundAt.localeCompare(a.foundAt));
}

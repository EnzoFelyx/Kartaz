import type { CurrentUserDto } from '@/lib/api/user-api';
import type { CellSelf } from '@/hooks/use-cell-room';

import { DEFAULT_MAX_ENERGY } from './constants';

/**
 * Números do HUD (energia, nível/XP, distância): valores do servidor, da sala em tempo real quando
 * conectado ou do `GET /user` fora de sala.
 */
export function useMapHud(self: CellSelf | null, user: CurrentUserDto | undefined) {
  const energy = self?.fuel ?? user?.fuel ?? DEFAULT_MAX_ENERGY;
  const xp = self?.xp ?? user?.xp ?? 0;
  // Barra de XP: quanto do nível atual já foi feito (faixa calculada pelo servidor).
  const levelXpStart = self?.levelXpStart ?? user?.levelXpStart ?? 0;
  const levelXpEnd = self?.levelXpEnd ?? user?.levelXpEnd ?? 0;

  return {
    energy,
    maxEnergy: self?.maxFuel ?? DEFAULT_MAX_ENERGY,
    xp,
    level: self?.level ?? user?.level ?? 1,
    xpProgress: levelXpEnd > levelXpStart ? (xp - levelXpStart) / (levelXpEnd - levelXpStart) : 1,
    distanceKm: self?.distanceKm ?? user?.distanceKm ?? 0,
    outOfEnergy: energy <= 0,
  };
}

/** Jogador do time para a pontuação (overall e seleção). */
export type ScoringPlayer = {
  ovr: number | null;
  nation: string | null;
};

export type TeamScore = {
  overall: number;
  /** Soma dos overalls dos 5 titulares. */
  baseSum: number;
  /** Bônus total (%) somando o de cada seleção com 2+ jogadores. */
  bonusPercent: number;
  /** Maior grupo de jogadores da mesma seleção. */
  maxSameNation: number;
};

/** Bônus de uma seleção pelo tamanho do grupo (mesma tabela do backend, `teamService.js`). */
export const NATION_BONUS_TABLE = [
  { count: 2, percent: 5 },
  { count: 3, percent: 10 },
  { count: 4, percent: 30 },
  { count: 5, percent: 80 },
] as const;

function bonusForGroupSize(size: number) {
  let percent = 0;
  for (const tier of NATION_BONUS_TABLE) if (size >= tier.count) percent = tier.percent;
  return percent;
}

/**
 * Overall do time, igual ao do backend: soma dos overalls × (1 + bônus/100). O bônus é cumulativo:
 * cada seleção com 2+ titulares soma o seu (ex.: 2 brasileiros + 3 argentinos = 5% + 10%).
 * Usado para o preview ao trocar titulares, antes de salvar.
 */
export function computeTeamScore(players: ScoringPlayer[]): TeamScore {
  const baseSum = players.reduce((sum, player) => sum + (Number(player.ovr) || 0), 0);
  const groups = new Map<string, number>();
  for (const player of players) {
    const key = player.nation?.trim().toLowerCase();
    if (key) groups.set(key, (groups.get(key) ?? 0) + 1);
  }
  let bonusPercent = 0;
  let maxSameNation = 0;
  for (const size of groups.values()) {
    bonusPercent += bonusForGroupSize(size);
    maxSameNation = Math.max(maxSameNation, size);
  }
  return { overall: Math.round(baseSum * (1 + bonusPercent / 100)), baseSum, bonusPercent, maxSameNation };
}

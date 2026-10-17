import { CLUB_BONUS_TABLE, LINEUP_SIZE, NATION_BONUS_TABLE, type BonusTier } from '@/lib/game/rules';

/** Jogador do time para a pontuação (overall, seleção e clube). */
export type ScoringPlayer = {
  ovr: number | null;
  nation: string | null;
  /** Clube do jogador (`card.team`). */
  club: string | null;
};

export type TeamScore = {
  overall: number;
  /** Soma dos overalls dos 5 titulares. */
  baseSum: number;
  /** Bônus total (%): seleções + clubes. */
  bonusPercent: number;
  /** Bônus (%) das seleções com 2+ titulares. */
  nationBonusPercent: number;
  /** Bônus (%) dos clubes com 2+ titulares. */
  clubBonusPercent: number;
  /** Maior grupo de titulares da mesma seleção. */
  maxSameNation: number;
  /** Maior grupo de titulares do mesmo clube. */
  maxSameClub: number;
};

function bonusForGroupSize(table: readonly BonusTier[], size: number) {
  let percent = 0;
  for (const tier of table) if (size >= tier.count) percent = tier.percent;
  return percent;
}

function groupKey(value: string | null | undefined) {
  return value?.trim().toLowerCase() || '';
}

/** Bônus (%) e maior grupo de um conjunto de contagens (seleções ou clubes). */
function sumGroups(counts: Iterable<number>, table: readonly BonusTier[]) {
  let bonus = 0;
  let max = 0;
  for (const size of counts) {
    bonus += bonusForGroupSize(table, size);
    max = Math.max(max, size);
  }
  return { bonus, max };
}

function countBy(values: string[]) {
  const counts = new Map<string, number>();
  for (const value of values) if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  return counts;
}

/**
 * Overall do time, igual ao do backend: soma dos overalls × (1 + bônus/100). O bônus é cumulativo:
 * cada seleção e cada clube com 2+ titulares somam o seu (ex.: 3 brasileiros + 2 do mesmo clube = 1,25% + 0,5%).
 * Usado para o preview ao trocar titulares, antes de salvar.
 */
export function computeTeamScore(players: ScoringPlayer[]): TeamScore {
  const baseSum = players.reduce((sum, player) => sum + (Number(player.ovr) || 0), 0);
  const nation = sumGroups(countBy(players.map((p) => groupKey(p.nation))).values(), NATION_BONUS_TABLE);
  const club = sumGroups(countBy(players.map((p) => groupKey(p.club))).values(), CLUB_BONUS_TABLE);
  const bonusPercent = nation.bonus + club.bonus;
  return {
    overall: Math.round(baseSum * (1 + bonusPercent / 100)),
    baseSum,
    bonusPercent,
    nationBonusPercent: nation.bonus,
    clubBonusPercent: club.bonus,
    maxSameNation: nation.max,
    maxSameClub: club.max,
  };
}

/** Carta candidata a titular (o mínimo para pontuar e não repetir jogador). */
export type LineupCandidate = ScoringPlayer & {
  /** Id da cópia. */
  id: string;
  /** Jogador da carta: o time não pode ter o mesmo jogador duas vezes. */
  cardId: number;
};

/** Melhores no geral que entram na busca. */
const TOP_OVERALL = 25;
/** Por seleção e por clube, os melhores que entram (para achar combinações com bônus). */
const TOP_PER_GROUP = LINEUP_SIZE;
/** Teto da busca: C(45, 5) ≈ 1,2 milhão de combinações, rápido o bastante no aparelho. */
const MAX_POOL = 45;

/**
 * Melhor escalação possível com as cartas do usuário: maior overall do time (mesma regra do
 * backend: soma × bônus de seleções e clubes); no empate, maior bônus. Uma cópia por jogador.
 * Como o bônus pode compensar overall menor, a busca usa os melhores no geral e os melhores de cada
 * seleção e de cada clube, e testa todas as combinações de 5. `null` se não houver 5 jogadores diferentes.
 */
export function pickBestLineup<T extends LineupCandidate>(candidates: T[]): T[] | null {
  // Uma cópia por jogador (a de maior overall), em ordem de overall.
  const byPlayer = new Map<number, T>();
  for (const candidate of candidates) {
    const current = byPlayer.get(candidate.cardId);
    if (!current || (Number(candidate.ovr) || 0) > (Number(current.ovr) || 0))
      byPlayer.set(candidate.cardId, candidate);
  }
  const unique = [...byPlayer.values()].sort((a, b) => (Number(b.ovr) || 0) - (Number(a.ovr) || 0));
  if (unique.length < LINEUP_SIZE) return null;

  // Pool: melhores no geral + melhores de cada seleção e de cada clube (sem passar do teto).
  const pool = new Set(unique.slice(0, TOP_OVERALL));
  const perNation = new Map<string, number>();
  const perClub = new Map<string, number>();
  for (const candidate of unique) {
    if (pool.size >= MAX_POOL) break;
    const nation = groupKey(candidate.nation);
    const club = groupKey(candidate.club);
    const nationTaken = nation ? (perNation.get(nation) ?? 0) : TOP_PER_GROUP;
    const clubTaken = club ? (perClub.get(club) ?? 0) : TOP_PER_GROUP;
    if (nationTaken >= TOP_PER_GROUP && clubTaken >= TOP_PER_GROUP) continue;
    if (nation) perNation.set(nation, nationTaken + 1);
    if (club) perClub.set(club, clubTaken + 1);
    pool.add(candidate);
  }
  const items = [...pool];
  const nations = items.map((item) => groupKey(item.nation));
  const clubs = items.map((item) => groupKey(item.club));
  const ovrs = items.map((item) => Number(item.ovr) || 0);

  let best: number[] = [];
  let bestOverall = -1;
  let bestBonus = -1;
  const chosen: number[] = [];
  const nationCounts = new Map<string, number>();
  const clubCounts = new Map<string, number>();

  const add = (counts: Map<string, number>, key: string, delta: number) => {
    if (!key) return;
    const next = (counts.get(key) ?? 0) + delta;
    if (next === 0) counts.delete(key);
    else counts.set(key, next);
  };

  const visit = (start: number, sum: number) => {
    if (chosen.length === LINEUP_SIZE) {
      const bonus =
        sumGroups(nationCounts.values(), NATION_BONUS_TABLE).bonus +
        sumGroups(clubCounts.values(), CLUB_BONUS_TABLE).bonus;
      const overall = Math.round(sum * (1 + bonus / 100));
      if (overall > bestOverall || (overall === bestOverall && bonus > bestBonus)) {
        bestOverall = overall;
        bestBonus = bonus;
        best = [...chosen];
      }
      return;
    }
    for (let index = start; index <= items.length - (LINEUP_SIZE - chosen.length); index += 1) {
      chosen.push(index);
      add(nationCounts, nations[index], 1);
      add(clubCounts, clubs[index], 1);
      visit(index + 1, sum + ovrs[index]);
      add(nationCounts, nations[index], -1);
      add(clubCounts, clubs[index], -1);
      chosen.pop();
    }
  };
  visit(0, 0);

  return best.map((index) => items[index]);
}

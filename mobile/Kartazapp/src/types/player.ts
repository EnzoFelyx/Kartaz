/**
 * Espelho do model Player do backend (Prisma).
 * Usado no SQLite local e no payload NDJSON do sync.
 */
export interface PlayerRow {
  id: number;

  rank: number | null;

  name: string;
  gender: string | null;

  ovr: number | null;
  pac: number | null;
  sho: number | null;
  pas: number | null;
  dri: number | null;
  def: number | null;
  phy: number | null;

  acceleration: number | null;
  sprintSpeed: number | null;
  positioning: number | null;
  finishing: number | null;
  shotPower: number | null;
  longShots: number | null;
  volleys: number | null;
  penalties: number | null;
  vision: number | null;
  crossing: number | null;
  freeKickAcc: number | null;
  shortPassing: number | null;
  longPassing: number | null;
  curve: number | null;
  dribbling: number | null;
  agility: number | null;
  balance: number | null;
  reactions: number | null;
  ballControl: number | null;
  composure: number | null;
  interceptions: number | null;
  headingAcc: number | null;
  defAwareness: number | null;
  standingTackle: number | null;
  slidingTackle: number | null;
  jumping: number | null;
  stamina: number | null;
  strength: number | null;
  aggression: number | null;

  position: string | null;
  weakFoot: number | null;
  skillMoves: number | null;
  preferredFoot: string | null;

  heightRaw: string | null;
  weightRaw: string | null;

  alternativePositions: string[];
  playStyle: string[];

  age: number | null;
  nation: string | null;
  league: string | null;
  team: string | null;

  url: string | null;

  gkDiving: number | null;
  gkHandling: number | null;
  gkKicking: number | null;
  gkPositioning: number | null;
  gkReflexes: number | null;

  maxSupply: number | null;
  foundCount: number | null;
  cardUpdatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

import type { Player, PlayerStats, Rarity } from '@/types/player-card';

import { MOCK_NATIONS } from './nations';
import { MOCK_PLAYER_CARDS } from './player-cards';

/**
 * Catálogo mockado de jogadores por seleção (todos os jogadores com dados, não só
 * os da coleção). Nomes fictícios — não usamos nomes reais (licenciamento).
 * Os jogadores da coleção (MOCK_PLAYER_CARDS) também aparecem aqui, na sua seleção.
 */
const NAMES_BY_NATION: Record<string, string[]> = {
  ARG: ['Mateo Ibarra', 'Santiago Rojas', 'Bruno Calvete', 'Nicolás Ferré', 'Tomás Aguirre'],
  AUS: ['Liam Hartley', 'Noah Fairbank', 'Cooper Mills', 'Jack Doolan'],
  BEL: ['Arne Vermeer', 'Lucas Desmet', 'Thibo Claes', 'Jens Wouters'],
  BRA: ['Rafael Moura', 'Caio Brandão', 'Diego Pimenta', 'Vitor Lacerda', 'Igor Salles'],
  CAN: ['Owen Tremblay', 'Ethan Gagnon', 'Marcus Leduc', 'Ryan Côté'],
  COL: ['Andrés Quintero', 'Juan Ospina', 'Camilo Restrepo', 'Felipe Arango'],
  CRO: ['Luka Babić', 'Ivan Kovač', 'Marko Perić', 'Ante Jurić'],
  ENG: ['Ethan Clarke', 'Harry Whitmore', 'Jude Ashford', 'Callum Reeves', 'Mason Pryce'],
  FRA: ['Lucas Dumont', 'Théo Marchand', 'Kylian Roussel', 'Hugo Lefèvre', 'Adrien Moulin'],
  GER: ['Jonas Becker', 'Leon Hartmann', 'Felix Brandt', 'Niklas Vogel', 'Timo Krause'],
  JPN: ['Kenji Arata', 'Takumi Hoshino', 'Ren Kawada', 'Daichi Morita'],
  KOR: ['Min-jun Seo', 'Ji-ho Baek', 'Hyun-woo Kang', 'Seung-min Yoo'],
  MAR: ['Youssef Amrani', 'Hakim Zerouali', 'Achraf Bennani', 'Sofiane Idrissi'],
  MEX: ['Luis Herrera', 'Diego Cárdenas', 'Emilio Robles', 'Andrés Villalobos'],
  NED: ['Daan Visser', 'Sem de Graaf', 'Lars Mulder', 'Bram Kuipers'],
  NGA: ['Samuel Okafor', 'Victor Adeyemi', 'Kelechi Nwosu', 'Tunde Bello'],
  POR: ['Tiago Ferraz', 'Rúben Matias', 'João Valente', 'Diogo Barreto', 'Nuno Seixas'],
  SEN: ['Ismaïla Ndour', 'Moussa Diallo', 'Cheikh Faye', 'Pape Sarr'],
  ESP: ['Diego Navarro', 'Pablo Ortega', 'Álvaro Reyes', 'Iker Salvador', 'Marcos Lozano'],
  URU: ['Facundo Olivera', 'Agustín Pereyra', 'Matías Suárez', 'Rodrigo Cabrera'],
  USA: ['Tyler Brooks', 'Weston Hayes', 'Christian Ford', 'Gio Martinez'],
};

const POSITIONS = ['ST', 'LW', 'CAM', 'CM', 'CB', 'GK', 'RW', 'LB'];

/** Número pseudoaleatório determinístico (mesmo resultado a cada execução). */
function seeded(seed: string, salt: number) {
  let hash = salt * 2654435761;
  for (let i = 0; i < seed.length; i++) hash = Math.imul(hash ^ seed.charCodeAt(i), 2246822519);
  return ((hash >>> 0) % 1000) / 1000;
}

function rarityFor(rating: number): Rarity {
  if (rating >= 92) return 'legendary';
  if (rating >= 88) return 'epic';
  if (rating >= 82) return 'rare';
  return 'common';
}

function statsFor(seed: string, rating: number): PlayerStats {
  const stat = (salt: number) => Math.round(Math.min(99, Math.max(30, rating - 15 + seeded(seed, salt) * 30)));
  return {
    speed: stat(1),
    shooting: stat(2),
    passing: stat(3),
    dribbling: stat(4),
    defense: stat(5),
    physical: stat(6),
  };
}

const TOTAL_COPIES = 1000;

/** Quanto mais raro (maior overall), menos cópias já foram encontradas. */
function copiesFoundFor(seed: string, rating: number) {
  const scarcity = Math.max(0, 95 - rating) / 23; // 0 (overall alto) → 1 (overall baixo)
  return Math.max(0, Math.round(seeded(seed, 7) * 400 * scarcity));
}

function buildCatalog(): Player[] {
  const owned = new Map(MOCK_PLAYER_CARDS.map((card) => [card.name, card]));

  return MOCK_NATIONS.flatMap((nation) =>
    (NAMES_BY_NATION[nation.code] ?? []).map((name, index) => {
      const ownedCard = owned.get(name);
      // Jogador da coleção: mantém os mesmos dados da carta.
      if (ownedCard) {
        const { id, position, rating, rarity, stats, copiesFound, totalCopies } = ownedCard;
        return {
          id,
          name,
          nation: nation.name,
          nationCode: nation.code,
          position,
          rating,
          rarity,
          stats,
          copiesFound,
          totalCopies,
        };
      }
      const id = `p-${nation.code}-${index}`;
      const rating = Math.round(72 + seeded(id, 0) * 22);
      return {
        id,
        name,
        nation: nation.name,
        nationCode: nation.code,
        position: POSITIONS[index % POSITIONS.length],
        rating,
        rarity: rarityFor(rating),
        stats: statsFor(id, rating),
        copiesFound: copiesFoundFor(id, rating),
        totalCopies: TOTAL_COPIES,
      };
    }),
  );
}

export const MOCK_PLAYERS: Player[] = buildCatalog();

/** Todos os jogadores de uma seleção, do maior para o menor overall. */
export function getPlayersByNation(nationCode: string) {
  return MOCK_PLAYERS.filter((player) => player.nationCode === nationCode).sort(
    (a, b) => b.rating - a.rating,
  );
}

export function getNationByCode(code: string) {
  return MOCK_NATIONS.find((nation) => nation.code === code);
}

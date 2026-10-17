import { playerPhotoUri } from '@/lib/api/image-uri';
import type { PlayerInstanceDto } from '@/lib/api/player-instances-api';
import type { UserInstanceDto } from '@/lib/api/user-instances-api';
import { getPlayerById } from '@/lib/db/playersDb';
import { DEFAULT_MAX_SUPPLY } from '@/lib/game/rules';
import type { PlayerRow } from '@/types/player';
import type { FoundCopy, Player, PlayerCard, Rarity } from '@/types/player-card';
import { getFlagEmojiForCountry } from '@/utils/flags';

/** Raridade pelo overall (mesmas faixas do projeto de referência). */
export function rarityFromRating(rating: number): Rarity {
  if (rating >= 90) return 'legendary';
  if (rating >= 87) return 'epic';
  if (rating >= 84) return 'rare';
  return 'common';
}

/** Linha do SQLite (espelho do backend) → jogador exibido nas telas. */
export function playerRowToPlayer(row: PlayerRow): Player {
  const rating = row.ovr ?? 0;
  const nation = row.nation?.trim() ?? '';
  return {
    id: row.id,
    name: row.name,
    nation,
    flagEmoji: getFlagEmojiForCountry(nation) ?? null,
    team: row.team?.trim() ?? '',
    position: row.position ?? '',
    rank: row.rank ?? null,
    rating,
    rarity: rarityFromRating(rating),
    imageUri: playerPhotoUri(row.id, row.url),
    copiesFound: row.foundCount ?? 0,
    totalCopies: row.maxSupply ?? DEFAULT_MAX_SUPPLY,
    stats: {
      speed: row.pac ?? 0,
      shooting: row.sho ?? 0,
      passing: row.pas ?? 0,
      dribbling: row.dri ?? 0,
      defense: row.def ?? 0,
      physical: row.phy ?? 0,
    },
  };
}

/**
 * Jogador da cópia: completa com o SQLite (stats, posição, rank), que tem a ficha inteira;
 * se o jogador ainda não estiver na base local, usa o resumo que veio da API.
 */
function playerFromInstanceCard(card: UserInstanceDto['card']): Player {
  const row = getPlayerById(card.id);
  if (row) return playerRowToPlayer(row);

  const rating = card.ovr ?? 0;
  const nation = card.nation?.trim() ?? '';
  return {
    id: card.id,
    name: card.name,
    nation,
    flagEmoji: getFlagEmojiForCountry(nation) ?? null,
    team: card.team?.trim() ?? '',
    position: '',
    rank: null,
    rating,
    rarity: rarityFromRating(rating),
    imageUri: playerPhotoUri(card.id, card.url),
    copiesFound: 0,
    totalCopies: card.maxSupply ?? DEFAULT_MAX_SUPPLY,
    stats: { speed: 0, shooting: 0, passing: 0, dribbling: 0, defense: 0, physical: 0 },
  };
}

/** Cópia do usuário (`GET /user/instances`) → carta da coleção. */
export function userInstanceToPlayerCard(dto: UserInstanceDto): PlayerCard {
  return {
    ...playerFromInstanceCard(dto.card),
    instanceId: dto.id,
    serial: dto.serialNumber,
    maxSerial: dto.serialMax,
    collectedAt: dto.foundWhen ?? dto.spawnedAt,
    collectedLocation: {
      city: dto.foundWhere?.city ?? null,
      state: dto.foundWhere?.state ?? null,
      lat: dto.foundWhere?.lat ?? null,
      lng: dto.foundWhere?.lng ?? null,
    },
    tradeOffers: 0,
  };
}

/** Cópia encontrada de um jogador (`GET /players/:id/instances`) → item da tela "Encontradas". */
export function playerInstanceToFoundCopy(dto: PlayerInstanceDto): FoundCopy {
  return {
    id: dto.id,
    cardId: dto.cardId,
    serial: dto.serialNumber,
    maxSerial: dto.serialMax,
    owner: dto.owner?.username ?? '—',
    ownerId: dto.owner?.id ?? null,
    foundAt: dto.foundWhen ?? dto.spawnedAt,
    foundLocation: {
      city: dto.foundWhere?.city ?? null,
      state: dto.foundWhere?.state ?? null,
      lat: dto.foundWhere?.lat ?? null,
      lng: dto.foundWhere?.lng ?? null,
    },
    tradeOffers: 0,
  };
}

/**
 * Jogador de uma carta que chegou só com o `cardId` (pack): ficha do SQLite; se o catálogo local
 * ainda não tiver o jogador, um placeholder com o número da carta.
 */
export function playerForCardId(cardId: number): Player {
  const row = getPlayerById(cardId);
  if (row) return playerRowToPlayer(row);
  return {
    id: cardId,
    name: `#${cardId}`,
    nation: '',
    flagEmoji: null,
    team: '',
    position: '',
    rank: null,
    rating: 0,
    rarity: 'common',
    imageUri: playerPhotoUri(cardId, null),
    copiesFound: 0,
    totalCopies: DEFAULT_MAX_SUPPLY,
    stats: { speed: 0, shooting: 0, passing: 0, dribbling: 0, defense: 0, physical: 0 },
  };
}

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StarIcon } from '@/components/icons/star-icon';
import type { PlayerCard, Rarity } from '@/types/player-card';
import { colors, rarityColors } from '@/theme/colors';

import { CardArt } from './card-art';

const RARITY_LABEL: Record<Rarity, string> = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

type PlayerCardRowProps = {
  card: PlayerCard;
  onPress?: () => void;
};

/**
 * Carta na visualização em lista: arte à esquerda, nome / seleção / raridade
 * no meio e o overall em destaque à direita. Borda na cor da raridade.
 */
export function PlayerCardRow({ card, onPress }: PlayerCardRowProps) {
  const tint = rarityColors[card.rarity];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${card.name}, ${card.nation}, ${RARITY_LABEL[card.rarity]}, rating ${card.rating}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { borderColor: tint, shadowColor: tint },
        pressed && styles.pressed,
      ]}>
      <CardArt
        rarity={card.rarity}
        nationCode={card.nationCode}
        position={card.position}
        codeSize={22}
        style={styles.thumb}
      />

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {card.name}
        </Text>
        <Text style={styles.nation} numberOfLines={1}>
          {card.nation}
        </Text>
        <View style={styles.rarityRow}>
          <StarIcon color={tint} size={13} />
          <Text style={styles.rarity}>{RARITY_LABEL[card.rarity]}</Text>
        </View>
      </View>

      <View style={styles.ratingBox}>
        <Text style={styles.rating}>{card.rating}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 14,
    borderRadius: 18,
    borderWidth: 2,
    backgroundColor: colors.card,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  thumb: {
    width: 84,
    height: 100,
    borderRadius: 14,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    color: colors.foreground,
    fontSize: 17,
    fontWeight: '800',
  },
  nation: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  rarityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  rarity: {
    color: colors.secondaryForeground,
    fontSize: 13,
    fontWeight: '600',
  },
  ratingBox: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  rating: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '800',
  },
});

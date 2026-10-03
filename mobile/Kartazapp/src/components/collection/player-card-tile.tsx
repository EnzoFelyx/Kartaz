import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { PlayerCard } from '@/types/player-card';
import { colors, rarityColors } from '@/theme/colors';

import { CardArt } from './card-art';
import { RarityBadge } from './rarity-badge';
import { RatingBadge } from './rating-badge';

type PlayerCardTileProps = {
  card: PlayerCard;
  onPress?: () => void;
};

/** Carta na visualização em grade. */
export function PlayerCardTile({ card, onPress }: PlayerCardTileProps) {
  const tint = rarityColors[card.rarity];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${card.name}, ${card.nation}, rating ${card.rating}, ${card.rarity}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        { borderColor: tint, shadowColor: tint },
        pressed && styles.pressed,
      ]}>
      <View>
        <CardArt rarity={card.rarity} nationCode={card.nationCode} position={card.position} style={styles.art} />
        <View style={styles.rating}>
          <RatingBadge rating={card.rating} />
        </View>
        <View style={styles.rarity}>
          <RarityBadge rarity={card.rarity} />
        </View>
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {card.name}
        </Text>
        <Text style={styles.nation} numberOfLines={1}>
          {card.nation}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 18,
    borderWidth: 2,
    backgroundColor: colors.card,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
  art: {
    height: 170,
  },
  rating: {
    position: 'absolute',
    top: 10,
    left: 10,
  },
  rarity: {
    position: 'absolute',
    top: 12,
    right: 10,
  },
  info: {
    gap: 2,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  name: {
    color: colors.foreground,
    fontSize: 15,
    fontWeight: '800',
  },
  nation: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
});

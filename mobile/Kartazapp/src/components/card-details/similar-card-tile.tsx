import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CardArt } from '@/components/collection/card-art';
import type { Player } from '@/types/player-card';
import { colors } from '@/theme/colors';
import { getNationName } from '@/utils/card-labels';

export const SIMILAR_TILE_WIDTH = 150;
const ART_HEIGHT = 190;
const RATING_SIZE = 40;

type SimilarCardTileProps = {
  player: Player;
  onPress?: () => void;
};

/** Carta da lista "Cartas similares": arte com a nota no canto, nome e seleção embaixo. */
export function SimilarCardTile({ player, onPress }: SimilarCardTileProps) {
  const { t } = useTranslation();
  const nation = getNationName(player.nationCode);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('cards.tileA11y', {
        name: player.name,
        nation,
        rating: player.rating,
        rarity: t(`rarity.${player.rarity}`),
      })}
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
      <View style={styles.art}>
        <CardArt
          rarity={player.rarity}
          nationCode={player.nationCode}
          position={player.position}
          codeSize={32}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.ratingCircle}>
          <Text style={styles.rating}>{player.rating}</Text>
        </View>
      </View>

      <Text style={styles.name} numberOfLines={1}>
        {player.name}
      </Text>
      <Text style={styles.nation} numberOfLines={1}>
        {nation}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: SIMILAR_TILE_WIDTH,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
  art: {
    height: ART_HEIGHT,
    overflow: 'hidden',
    borderRadius: 18,
    marginBottom: 10,
  },
  ratingCircle: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: RATING_SIZE,
    height: RATING_SIZE,
    borderRadius: RATING_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  rating: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '800',
  },
  name: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '800',
  },
  nation: {
    marginTop: 2,
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});

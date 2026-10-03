import { StyleSheet, View } from 'react-native';

import { StarIcon } from '@/components/icons/star-icon';
import type { Rarity } from '@/types/player-card';
import { colors, rarityColors } from '@/theme/colors';

type RarityBadgeProps = {
  rarity: Rarity;
};

/** Pílula com estrela na cor da raridade. */
export function RarityBadge({ rarity }: RarityBadgeProps) {
  return (
    <View
      style={[styles.badge, { backgroundColor: rarityColors[rarity] }]}
      accessible
      accessibilityLabel={`${rarity} card`}>
      <StarIcon color={colors.white} size={11} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
});

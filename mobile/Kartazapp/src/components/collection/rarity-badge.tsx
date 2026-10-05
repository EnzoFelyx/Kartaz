import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { StarIcon } from '@/components/icons/star-icon';
import type { Rarity } from '@/types/player-card';
import { colors, rarityColors } from '@/theme/colors';

type RarityBadgeProps = {
  rarity: Rarity;
};

/** Pílula com estrela na cor da raridade. */
export function RarityBadge({ rarity }: RarityBadgeProps) {
  const { t } = useTranslation();
  return (
    <View
      style={[styles.badge, { backgroundColor: rarityColors[rarity] }]}
      accessible
      accessibilityLabel={t('cards.rarityBadgeA11y', { rarity: t(`rarity.${rarity}`) })}>
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

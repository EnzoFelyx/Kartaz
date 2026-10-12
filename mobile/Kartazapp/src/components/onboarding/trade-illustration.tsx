import { StyleSheet, View } from 'react-native';

import { ChevronRightIcon } from '@/components/icons/chevron-right-icon';
import { StarIcon } from '@/components/icons/star-icon';
import { colors, withAlpha } from '@/theme/colors';

const CARD_WIDTH = 88;
const CARD_HEIGHT = 120;

/** Duas cartas com setas entre elas (troca de cartas). */
export function TradeIllustration() {
  return (
    <View style={styles.row}>
      <TradeCard color={colors.violet} />
      <View style={styles.arrows}>
        <ChevronRightIcon color={colors.primary} size={26} />
        <ChevronRightIcon color={colors.primary} size={26} />
      </View>
      <TradeCard color={colors.primary} />
    </View>
  );
}

function TradeCard({ color }: { color: string }) {
  return (
    <View style={[styles.card, { borderColor: withAlpha(color, 0.8), backgroundColor: withAlpha(color, 0.08) }]}>
      <StarIcon color={color} size={40} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 28,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrows: {
    gap: 8,
  },
});

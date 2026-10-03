import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';

type RatingBadgeProps = {
  rating: number;
  size?: number;
};

/** Círculo com o overall da carta (aro ciano). */
export function RatingBadge({ rating, size = 40 }: RatingBadgeProps) {
  return (
    <View
      style={[styles.badge, { width: size, height: size, borderRadius: size / 2 }]}
      accessible
      accessibilityLabel={`Rating ${rating}`}>
      <Text style={[styles.text, { fontSize: size * 0.4 }]}>{rating}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  text: {
    color: colors.foreground,
    fontWeight: '800',
  },
});

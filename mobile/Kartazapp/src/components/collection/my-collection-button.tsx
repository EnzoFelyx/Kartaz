import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ChevronRightIcon } from '@/components/icons/chevron-right-icon';
import { LayersIcon } from '@/components/icons/layers-icon';
import { colors, withAlpha } from '@/theme/colors';

type MyCollectionButtonProps = {
  /** Quantidade de cartas na coleção do jogador. */
  count: number;
  onPress?: () => void;
};

/** Atalho para a coleção do jogador (por enquanto demonstrativo, sem navegação). */
export function MyCollectionButton({ count, onPress }: MyCollectionButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`My Collection, ${count} cards`}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <View style={styles.iconBox}>
        <LayersIcon color={colors.primary} size={24} />
      </View>
      <View style={styles.texts}>
        <Text style={styles.title}>My Collection</Text>
        <Text style={styles.subtitle}>{count} cards</Text>
      </View>
      <ChevronRightIcon color={colors.secondaryForeground} size={20} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 20,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(colors.primary, 0.12),
    borderWidth: 1,
    borderColor: withAlpha(colors.primary, 0.2),
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.foreground,
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.secondaryForeground,
    fontSize: 14,
  },
});

import { Pressable, StyleSheet } from 'react-native';

import { RadarIcon } from '@/components/icons/radar-icon';
import { colors, withAlpha } from '@/theme/colors';

const FAB_SIZE = 60;

type RadarFabProps = {
  onPress: () => void;
};

/** Estado recolhido do MapDashboard: um botão de radar que abre o painel ao tocar. */
export function RadarFab({ onPress }: RadarFabProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open mission dashboard"
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.fab, pressed && styles.pressed]}>
      <RadarIcon color={colors.primary} size={28} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: withAlpha(colors.primary, 0.4),
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  pressed: {
    transform: [{ scale: 0.94 }],
  },
});

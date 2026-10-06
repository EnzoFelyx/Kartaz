import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ChevronRightIcon } from '@/components/icons/chevron-right-icon';
import { GlobeIcon } from '@/components/icons/globe-icon';
import { colors, withAlpha } from '@/theme/colors';

type NationRowProps = {
  name: string;
  /** Bandeira da seleção; sem ela, fica o ícone de globo. */
  flagEmoji?: string | null;
  onPress?: () => void;
};

/** Linha de uma seleção na visualização por países, com a bandeira à esquerda. */
export function NationRow({ name, flagEmoji, onPress }: NationRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.iconBox}>
        {flagEmoji ? (
          <Text style={styles.flag}>{flagEmoji}</Text>
        ) : (
          <GlobeIcon color={colors.primary} size={22} />
        )}
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>
      <ChevronRightIcon color={colors.secondaryForeground} size={20} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 18,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(colors.primary, 0.1),
  },
  flag: {
    fontSize: 26,
  },
  name: {
    flex: 1,
    color: colors.foreground,
    fontSize: 17,
    fontWeight: '800',
  },
});

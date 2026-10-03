import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';

type ZoneStatProps = {
  icon: ReactNode;
  value: string;
  accessibilityLabel?: string;
};

/** Um indicador da zona: ícone colorido + valor. */
export function ZoneStat({ icon, value, accessibilityLabel }: ZoneStatProps) {
  return (
    <View style={styles.stat} accessible accessibilityLabel={accessibilityLabel}>
      {icon}
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  value: {
    color: colors.foreground,
    fontSize: 13,
    fontWeight: '600',
  },
});

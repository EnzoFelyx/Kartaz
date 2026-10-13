import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';

type ZoneStatProps = {
  icon: ReactNode;
  value: string;
  accessibilityLabel?: string;
  /** Texto longo (ex.: nome de jogador): encolhe na linha e corta com "…". */
  shrink?: boolean;
};

/** Um indicador da zona: ícone colorido + valor. */
export function ZoneStat({ icon, value, accessibilityLabel, shrink = false }: ZoneStatProps) {
  return (
    <View style={[styles.stat, shrink && styles.shrink]} accessible accessibilityLabel={accessibilityLabel}>
      {icon}
      <Text style={[styles.value, shrink && styles.shrink]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  shrink: {
    flexShrink: 1,
  },
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

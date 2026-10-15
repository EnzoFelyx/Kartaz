import { StyleSheet, Text, View } from 'react-native';

import { colors, withAlpha } from '@/theme/colors';

type SummaryTileProps = {
  value: string;
  label: string;
  /** Cor do valor e do fundo translúcido (hex #rrggbb do tema). */
  color: string;
};

/** Resumo no topo das Conquistas (ex.: "0V · 0D" Vitórias). */
export function SummaryTile({ value, label, color }: SummaryTileProps) {
  return (
    <View
      style={[styles.tile, { backgroundColor: withAlpha(color, 0.08), borderColor: withAlpha(color, 0.22) }]}
      accessible
      accessibilityLabel={`${value} ${label}`}>
      <Text style={[styles.value, { color }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.label} numberOfLines={1} adjustsFontSizeToFit>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  value: {
    fontSize: 18,
    fontWeight: '900',
  },
  label: {
    color: colors.secondaryForeground,
    fontSize: 11,
  },
});

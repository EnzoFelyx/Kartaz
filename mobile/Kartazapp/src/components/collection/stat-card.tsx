import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';

type StatCardProps = {
  value: number;
  label: string;
  valueColor?: string;
};

/** Card de estatística da coleção: valor grande + legenda. */
export function StatCard({ value, label, valueColor = colors.foreground }: StatCardProps) {
  return (
    <View style={styles.card} accessible accessibilityLabel={`${value} ${label}`}>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
  },
  value: {
    fontSize: 26,
    fontWeight: '800',
  },
  label: {
    color: colors.secondaryForeground,
    fontSize: 12,
    fontWeight: '500',
  },
});

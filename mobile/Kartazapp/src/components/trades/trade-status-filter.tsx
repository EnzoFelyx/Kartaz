import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { TradeTab } from '@/hooks/queries/use-trades';
import { colors, withAlpha } from '@/theme/colors';
import { tradeStatusColors } from '@/theme/game-colors';

type TradeStatusFilterProps = {
  statuses: TradeTab[];
  selected: TradeTab;
  /** Total de propostas de cada aba (`undefined` enquanto carrega). */
  counts: Partial<Record<TradeTab, number>>;
  onSelect: (status: TradeTab) => void;
};

/** Abas das trocas (Pendentes / Aceitas): o nome e o total de cada uma; a ativa fica na cor do status. */
export function TradeStatusFilter({ statuses, selected, counts, onSelect }: TradeStatusFilterProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.bar} accessibilityRole="tablist">
      {statuses.map((status) => {
        const active = status === selected;
        const color = tradeStatusColors[status];
        const label = t(`trades.status.${status}`);
        const count = counts[status];
        return (
          <Pressable
            key={status}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${label}: ${count ?? 0}`}
            onPress={() => onSelect(status)}
            style={({ pressed }) => [
              styles.tab,
              active && { backgroundColor: withAlpha(color, 0.16), borderColor: withAlpha(color, 0.6) },
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.label, active && { color }]} numberOfLines={1}>
              {label}
            </Text>
            <View style={[styles.count, { backgroundColor: withAlpha(active ? color : colors.subtle, 0.25) }]}>
              <Text style={[styles.countText, active && { color }]}>{count ?? '—'}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    gap: 6,
    padding: 5,
    borderRadius: 16,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.transparent,
  },
  pressed: {
    opacity: 0.8,
  },
  label: {
    color: colors.secondaryForeground,
    fontSize: 14,
    fontWeight: '800',
  },
  count: {
    minWidth: 24,
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  countText: {
    color: colors.secondaryForeground,
    fontSize: 12,
    fontWeight: '900',
  },
});

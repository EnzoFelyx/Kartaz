import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ProgressBar } from '@/components/ui/progress-bar';
import { colors, withAlpha } from '@/theme/colors';

type StatRowProps = {
  label: string;
  value: number;
  color: string;
  icon: ReactNode;
  /** Atraso (ms) para a barra começar a encher. */
  fillDelay?: number;
};

/** Card de um atributo do jogador: ícone, nome, valor e barra na cor do atributo. */
export function StatRow({ label, value, color, icon, fillDelay }: StatRowProps) {
  return (
    <View style={styles.card} accessible accessibilityLabel={`${label} ${value}`}>
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: withAlpha(color, 0.18) }]}>{icon}</View>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
      <ProgressBar progress={value / 100} height={6} colors={[color, color]} glowColor={color} fillDelay={fillDelay} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 14,
    padding: 16,
    borderRadius: 18,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '700',
  },
  value: {
    color: colors.foreground,
    fontSize: 20,
    fontWeight: '800',
  },
});

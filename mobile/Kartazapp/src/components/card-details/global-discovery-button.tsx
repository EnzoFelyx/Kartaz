import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ChevronRightIcon } from '@/components/icons/chevron-right-icon';
import { LayersIcon } from '@/components/icons/layers-icon';
import { ProgressBar } from '@/components/ui/progress-bar';
import { colors, withAlpha } from '@/theme/colors';
import { formatNumber, formatPercent } from '@/utils/card-labels';

type GlobalDiscoveryButtonProps = {
  /** Cópias deste jogador já encontradas por todos os jogadores. */
  found: number;
  /** Total de cópias existentes. */
  total: number;
  onPress?: () => void;
};

/**
 * Raridade global do jogador: quantas cópias já foram encontradas no jogo.
 * Fica nos detalhes da carta, abaixo do nome; o toque abre as cópias encontradas.
 */
export function GlobalDiscoveryButton({ found, total, onPress }: GlobalDiscoveryButtonProps) {
  const { t } = useTranslation();
  const ratio = total > 0 ? found / total : 0;
  const counter = `${formatNumber(found)} / ${formatNumber(total)}`;
  const percentLabel = t('cardDetails.percentFound', { percent: formatPercent(ratio) });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t('cardDetails.globalDiscovery')}, ${counter}, ${percentLabel}`}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <View style={styles.iconBox}>
        <LayersIcon color={colors.primarySoft} size={24} />
      </View>

      <View style={styles.info}>
        <View style={styles.headerRow}>
          <Text style={styles.label} numberOfLines={1}>
            {t('cardDetails.globalDiscovery')}
          </Text>
          <Text style={styles.counter}>{counter}</Text>
        </View>
        <ProgressBar progress={ratio} height={4} colors={[colors.violet, colors.primary]} glowColor={colors.violet} />
        <Text style={styles.percent}>{percentLabel}</Text>
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
    paddingVertical: 18,
    paddingLeft: 18,
    paddingRight: 14,
    borderRadius: 22,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: withAlpha(colors.white, 0.1),
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(colors.violet, 0.35),
    borderWidth: 1,
    borderColor: withAlpha(colors.violet, 0.5),
  },
  info: {
    flex: 1,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  label: {
    flexShrink: 1,
    color: colors.mutedForeground,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  counter: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '800',
  },
  percent: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
});

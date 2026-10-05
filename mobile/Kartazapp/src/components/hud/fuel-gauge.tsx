import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { BoltIcon } from '@/components/icons/bolt-icon';
import { ProgressBar } from '@/components/ui/progress-bar';
import { colors } from '@/theme/colors';

type FuelGaugeProps = {
  fuel: number;
  maxFuel: number;
  /** Abaixo desta fração o painel entra em estado de alerta (laranja). */
  lowThreshold?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Painel de Rocket Fuel do HUD do mapa: ícone + "FUEL", porcentagem e barra.
 * Os valores vêm de fora (store/servidor); o componente só exibe.
 */
export function FuelGauge({ fuel, maxFuel, lowThreshold = 0.3, style }: FuelGaugeProps) {
  const { t } = useTranslation();
  const ratio = maxFuel > 0 ? fuel / maxFuel : 0;
  const percent = Math.round(Math.min(Math.max(ratio, 0), 1) * 100);
  const isLow = ratio < lowThreshold;
  // Fuel é amarelo; no estado LOW tudo vira laranja.
  const tint = isLow ? colors.accent : colors.gold;

  return (
    <View
      style={[styles.panel, style]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={t('hud.energyA11y')}
      accessibilityValue={{ min: 0, max: 100, now: percent }}>
      <View style={styles.header}>
        <View style={styles.title}>
          <BoltIcon color={tint} size={18} />
          <Text style={[styles.label, { color: tint }]}>{t('hud.energy')}</Text>
        </View>
        <Text style={[styles.value, isLow && { color: colors.accent }]}>{percent}%</Text>
      </View>

      <ProgressBar
        progress={ratio}
        colors={isLow ? [colors.accent, colors.fuelEnd] : [colors.gold, colors.fuelEnd]}
        glowColor={tint}
        pulse
      />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  value: {
    color: colors.foreground,
    fontSize: 15,
    fontWeight: '800',
  },
});

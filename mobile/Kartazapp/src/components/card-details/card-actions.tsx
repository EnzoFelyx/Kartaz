import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';

/** Ações no fim do detalhe (demonstrativas: as telas de troca e de mercado a partir daqui ainda não existem). */
export function CardActions() {
  const { t } = useTranslation();
  return (
    <View style={styles.actions}>
      <Pressable
        accessibilityRole="button"
        style={({ pressed }) => [styles.actionButton, styles.tradeButton, pressed && styles.actionPressed]}>
        <Text style={styles.tradeText}>{t('cardDetails.tradeCard')}</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        style={({ pressed }) => [styles.actionButton, styles.marketButton, pressed && styles.actionPressed]}>
        <Text style={styles.marketText}>{t('cardDetails.viewOnMarket')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 18,
  },
  actionPressed: {
    transform: [{ scale: 0.97 }],
  },
  tradeButton: {
    backgroundColor: colors.primary,
  },
  tradeText: {
    color: colors.primaryForeground,
    fontSize: 16,
    fontWeight: '800',
  },
  marketButton: {
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  marketText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
});

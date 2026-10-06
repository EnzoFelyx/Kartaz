import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';

/** Cobre a tela enquanto o SQLite é preparado (seed do bundle na primeira abertura). */
export function DatabaseInitSplash() {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.message}>{t('common.updatingDatabase')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    zIndex: 9999,
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    color: colors.mutedForeground,
  },
});

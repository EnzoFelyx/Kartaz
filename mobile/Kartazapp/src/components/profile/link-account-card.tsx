import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { SocialAuthButtons } from '@/components/auth/social-auth-buttons';
import { ShieldIcon } from '@/components/icons/shield-icon';
import { colors, withAlpha } from '@/theme/colors';

/** Card do Perfil para convidados: vincula Apple/Google para não perder o progresso. */
export function LinkAccountCard() {
  const { t } = useTranslation();

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <ShieldIcon color={colors.gold} size={20} />
        </View>
        <View style={styles.texts}>
          <Text style={styles.title}>{t('linkAccount.title')}</Text>
          <Text style={styles.description}>{t('linkAccount.description')}</Text>
        </View>
      </View>
      <SocialAuthButtons />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 16,
    padding: 18,
    borderRadius: 22,
    backgroundColor: withAlpha(colors.gold, 0.06),
    borderWidth: 1,
    borderColor: withAlpha(colors.gold, 0.3),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(colors.gold, 0.15),
  },
  texts: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '800',
  },
  description: {
    color: colors.secondaryForeground,
    fontSize: 13,
    lineHeight: 18,
  },
});

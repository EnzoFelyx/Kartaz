import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthButton } from '@/components/auth/auth-button';
import { useSignInAsGuest } from '@/hooks/queries/use-session';
import { colors } from '@/theme/colors';

export default function LoginScreen() {
  const { t } = useTranslation();
  const guest = useSignInAsGuest();

  const playAsGuest = () => {
    guest.mutate(undefined, {
      onSuccess: () => router.replace('/map'),
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('auth.title')}</Text>
        <Text style={styles.subtitle}>{t('auth.subtitle')}</Text>
      </View>

      <View style={styles.actions}>
        {/* TODO: login com conta (ainda sem ação). */}
        <AuthButton label={t('auth.signIn')} onPress={() => {}} disabled={guest.isPending} />
        <AuthButton
          label={t('auth.playAsGuest')}
          variant="secondary"
          onPress={playAsGuest}
          loading={guest.isPending}
        />
        {guest.isError && <Text style={styles.error}>{t('common.loadError')}</Text>}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: colors.background,
  },
  header: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    color: colors.foreground,
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: 4,
  },
  subtitle: {
    color: colors.mutedForeground,
    fontSize: 12,
    letterSpacing: 1,
    textAlign: 'center',
  },
  actions: {
    gap: 12,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    textAlign: 'center',
  },
});

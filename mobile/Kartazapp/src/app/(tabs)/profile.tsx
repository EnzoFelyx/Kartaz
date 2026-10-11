import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BoltIcon } from '@/components/icons/bolt-icon';
import { MapPinIcon } from '@/components/icons/map-pin-icon';
import { SettingsIcon } from '@/components/icons/settings-icon';
import { StarIcon } from '@/components/icons/star-icon';
import { TrophyIcon } from '@/components/icons/trophy-icon';
import { ProfileHeaderCard } from '@/components/profile/profile-header-card';
import { StatCard } from '@/components/profile/stat-card';
import { TAB_BAR_BOTTOM_GAP, TAB_BAR_HEIGHT } from '@/components/tab-bar';
import { IconButton } from '@/components/ui/icon-button';
import { useCurrentUser } from '@/hooks/queries/use-current-user';
import { useCollectionCount } from '@/hooks/queries/use-my-collection';
import { useSession, useSignOut } from '@/hooks/queries/use-session';
import { resolveApiUri } from '@/lib/api/image-uri';
import { colors } from '@/theme/colors';
import { formatNumber } from '@/utils/card-labels';
import { listItemEntering } from '@/utils/list-loading';

// Ainda sem sistema de conquistas e de amigos: valores fixos até existirem.
const MOCK_PROFILE = { achievements: 1, friendsCount: 3 };
const STAT_ICON_SIZE = 22;

/** Perfil: header, card do jogador e estatísticas (dados do backend via GET /user). */
export default function ProfileScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { data: session } = useSession();
  const user = useCurrentUser();
  const collectionCount = useCollectionCount();
  const signOut = useSignOut();

  const profile = user.data;
  const username = profile?.username ?? session?.username ?? '';
  const level = profile?.level ?? 1;
  const isGuest = profile?.is_guest ?? session?.isGuest ?? true;

  const confirmSignOut = () => {
    // Convidado não vinculado: a sessão só existe neste aparelho, sair apaga o acesso de vez.
    if (isGuest) {
      Alert.alert(t('auth.guestSignOutTitle'), t('auth.guestSignOutMessage'), [
        { text: t('auth.cancel'), style: 'cancel' },
        { text: t('auth.signOut'), style: 'destructive', onPress: () => signOut.mutate() },
      ]);
      return;
    }
    signOut.mutate();
  };

  // Configurações ainda não existem: por enquanto a engrenagem só oferece encerrar a sessão.
  const openSettings = () => {
    Alert.alert(t('profile.settings'), undefined, [
      { text: t('auth.cancel'), style: 'cancel' },
      { text: t('profile.endSession'), style: 'destructive', onPress: confirmSignOut },
    ]);
  };

  // A aba fica montada: remonta o conteúdo a cada foco para a entrada em cascata rodar de novo.
  const [focusKey, setFocusKey] = useState(0);
  useFocusEffect(
    useCallback(() => {
      setFocusKey((key) => key + 1);
    }, []),
  );

  const stats = [
    {
      color: colors.violet,
      icon: <StarIcon color={colors.violet} size={STAT_ICON_SIZE} />,
      value: formatNumber(collectionCount.data ?? 0),
      label: t('profile.stats.totalCards'),
    },
    {
      color: colors.gold,
      icon: <TrophyIcon color={colors.gold} size={STAT_ICON_SIZE} />,
      value: formatNumber(MOCK_PROFILE.achievements),
      label: t('profile.stats.achievements'),
    },
    {
      color: colors.primary,
      icon: <BoltIcon color={colors.primary} size={STAT_ICON_SIZE} />,
      value: formatNumber(profile?.xp ?? 0),
      label: t('profile.stats.totalXp'),
    },
    {
      color: colors.success,
      icon: <MapPinIcon color={colors.success} size={STAT_ICON_SIZE} />,
      value: formatNumber(profile?.coverage ?? 0),
      label: t('profile.stats.locations'),
    },
  ];

  const refresh = () => {
    void user.refetch();
    void collectionCount.refetch();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + TAB_BAR_BOTTOM_GAP + TAB_BAR_HEIGHT + 24,
        },
      ]}
      refreshControl={
        <RefreshControl refreshing={user.isRefetching} onRefresh={refresh} tintColor={colors.primary} />
      }>
      {/* Entrada em cascata (mesma da tela de Cartas): header, card do jogador e cada estatística. */}
      <View key={focusKey} style={styles.sections}>
        <Animated.View entering={listItemEntering(0)} style={styles.header}>
          <View style={styles.titles}>
            <Text style={styles.title} accessibilityRole="header">
              {t('profile.title')}
            </Text>
            <Text style={styles.subtitle}>{t('profile.subtitle')}</Text>
          </View>
          <IconButton
            icon={<SettingsIcon color={colors.primary} size={20} />}
            accessibilityLabel={t('profile.settings')}
            onPress={openSettings}
          />
        </Animated.View>

        <Animated.View entering={listItemEntering(1)}>
          <ProfileHeaderCard
            username={username}
            level={level}
            avatarUri={resolveApiUri(profile?.avatar)}
            friendsCount={MOCK_PROFILE.friendsCount}
            onPressEdit={() => router.push('/edit-profile')}
            onPressShare={() => {}}
          />
        </Animated.View>

        <View style={styles.grid}>
          {stats.map((stat, index) => (
            <Animated.View key={stat.label} entering={listItemEntering(index + 2)} style={styles.gridItem}>
              <StatCard color={stat.color} icon={stat.icon} value={stat.value} label={stat.label} />
            </Animated.View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 20,
  },
  sections: {
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  titles: {
    flex: 1,
    gap: 6,
  },
  title: {
    color: colors.foreground,
    fontSize: 32,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.secondaryForeground,
    fontSize: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  gridItem: {
    flexBasis: '46%',
    flexGrow: 1,
  },
});

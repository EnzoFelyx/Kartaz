import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BoltIcon } from '@/components/icons/bolt-icon';
import { FlagIcon } from '@/components/icons/flag-icon';
import { MapPinIcon } from '@/components/icons/map-pin-icon';
import { SettingsIcon } from '@/components/icons/settings-icon';
import { StarIcon } from '@/components/icons/star-icon';
import { TrophyIcon } from '@/components/icons/trophy-icon';
import { LinkAccountCard } from '@/components/profile/link-account-card';
import { ProfileHeaderCard } from '@/components/profile/profile-header-card';
import { StatCard } from '@/components/profile/stat-card';
import { TAB_BAR_BOTTOM_GAP, TAB_BAR_HEIGHT } from '@/components/tab-bar';
import { IconButton } from '@/components/ui/icon-button';
import { colors } from '@/theme/colors';
import { formatNumber } from '@/utils/card-labels';
import { listItemEntering } from '@/utils/list-loading';

import type { ProfileViewModel } from './use-view-model';

const STAT_ICON_SIZE = 22;

/** Título com a engrenagem, card do jogador, vínculo de conta (convidado) e as estatísticas. */
export function ProfileView({
  replayKey,
  username,
  level,
  avatarUri,
  friendsCount,
  isGuest,
  stats,
  refreshing,
  refresh,
  openSettings,
  openEditProfile,
}: ProfileViewModel) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const statCards = [
    {
      color: colors.violet,
      icon: <StarIcon color={colors.violet} size={STAT_ICON_SIZE} />,
      value: formatNumber(stats.totalCards),
      label: t('profile.stats.totalCards'),
    },
    {
      color: colors.gold,
      icon: <TrophyIcon color={colors.gold} size={STAT_ICON_SIZE} />,
      value: formatNumber(stats.achievements),
      label: t('profile.stats.achievements'),
    },
    {
      color: colors.primary,
      icon: <BoltIcon color={colors.primary} size={STAT_ICON_SIZE} />,
      value: formatNumber(stats.totalXp),
      label: t('profile.stats.totalXp'),
    },
    {
      color: colors.success,
      icon: <MapPinIcon color={colors.success} size={STAT_ICON_SIZE} />,
      value: formatNumber(stats.locations),
      label: t('profile.stats.locations'),
    },
    {
      color: colors.accent,
      icon: <FlagIcon color={colors.accent} size={STAT_ICON_SIZE} />,
      value: formatNumber(stats.flags),
      label: t('profile.stats.flags'),
    },
  ];

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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}>
      {/* Entrada em cascata (mesma da tela de Cartas): header, card do jogador e cada estatística. */}
      <View key={replayKey} style={styles.sections}>
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
            avatarUri={avatarUri}
            friendsCount={friendsCount}
            onPressEdit={openEditProfile}
            onPressShare={() => {}}
          />
        </Animated.View>

        {/* Convidado: oferece vincular Apple/Google; some quando a conta é vinculada. */}
        {isGuest && (
          <Animated.View entering={listItemEntering(2)}>
            <LinkAccountCard />
          </Animated.View>
        )}

        <View style={styles.grid}>
          {statCards.map((stat, index) => (
            <Animated.View key={stat.label} entering={listItemEntering(index + 3)} style={styles.gridItem}>
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

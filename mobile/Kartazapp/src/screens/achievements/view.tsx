import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AchievementCard } from '@/components/achievements/achievement-card';
import { MyTeamCard } from '@/components/achievements/my-team-card';
import { SummaryTile } from '@/components/achievements/summary-tile';
import { CardsIcon } from '@/components/icons/cards-icon';
import { FlagIcon } from '@/components/icons/flag-icon';
import { MapCardIcon } from '@/components/icons/map-card-icon';
import { TrophyIcon } from '@/components/icons/trophy-icon';
import { WalkingIcon } from '@/components/icons/walking-icon';
import { TAB_BAR_BOTTOM_GAP, TAB_BAR_HEIGHT } from '@/components/tab-bar';
import { colors } from '@/theme/colors';
import { listItemEntering } from '@/utils/list-loading';

import type { Achievement, AchievementKey, AchievementsViewModel } from './use-view-model';

const ICON_SIZE = 24;

/** Ícone de cada conquista (recebe a cor da situação). */
const ACHIEVEMENT_ICON: Record<AchievementKey, (color: string) => ReactNode> = {
  firstTeamWin: (color) => <TrophyIcon color={color} size={ICON_SIZE} />,
  winStreak: (color) => <TrophyIcon color={color} size={ICON_SIZE} />,
  firstDiscovery: () => <MapCardIcon height={ICON_SIZE + 4} />,
  collector: (color) => <CardsIcon color={color} size={ICON_SIZE} />,
  flagHunter: (color) => <FlagIcon color={color} size={ICON_SIZE} />,
  walker: (color) => <WalkingIcon color={color} size={ICON_SIZE} />,
};

/** Card "Meu time", os três resumos e as seções de conquistas do time e individuais. */
export function AchievementsView({
  team,
  wins,
  losses,
  teamAchievements,
  teamDone,
  individualAchievements,
  individualPercent,
  refreshing,
  refresh,
  openTeam,
}: AchievementsViewModel) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const renderAchievement = (item: Achievement, index: number) => (
    <Animated.View key={item.key} entering={listItemEntering(index)}>
      <AchievementCard
        renderIcon={ACHIEVEMENT_ICON[item.key]}
        title={t(`achievements.items.${item.key}.title`)}
        description={t(`achievements.items.${item.key}.description`)}
        status={item.status}
        current={item.current}
        target={item.target}
      />
    </Animated.View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + TAB_BAR_BOTTOM_GAP + TAB_BAR_HEIGHT + 24 },
      ]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}>
      <Animated.View entering={listItemEntering(0)} style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          {t('achievements.title')}
        </Text>
        <Text style={styles.subtitle}>{t('achievements.subtitle')}</Text>
      </Animated.View>

      <Animated.View entering={listItemEntering(1)}>
        <MyTeamCard team={team} onPress={openTeam} />
      </Animated.View>

      <Animated.View entering={listItemEntering(2)} style={styles.summary}>
        <SummaryTile
          value={t('achievements.recordShort', { wins, losses })}
          label={t('achievements.wins')}
          color={colors.success}
        />
        <SummaryTile
          value={`${teamDone}/${teamAchievements.length}`}
          label={t('achievements.teamAchievementsShort')}
          color={colors.violet}
        />
        <SummaryTile value={`${individualPercent}%`} label={t('achievements.individualShort')} color={colors.primary} />
      </Animated.View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          {t('achievements.teamSection')}
        </Text>
        {teamAchievements.map((item, index) => renderAchievement(item, index + 3))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          {t('achievements.individualSection')}
        </Text>
        {individualAchievements.map((item, index) => renderAchievement(item, index + 5))}
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
    gap: 16,
  },
  header: {
    gap: 6,
    marginBottom: 4,
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
  summary: {
    flexDirection: 'row',
    gap: 10,
  },
  section: {
    gap: 12,
    marginTop: 8,
  },
  sectionTitle: {
    color: colors.foreground,
    fontSize: 20,
    fontWeight: '800',
  },
});

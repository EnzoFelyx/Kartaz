import { router, useFocusEffect } from 'expo-router';
import { useCallback, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AchievementCard, type AchievementStatus } from '@/components/achievements/achievement-card';
import { MyTeamCard } from '@/components/achievements/my-team-card';
import { SummaryTile } from '@/components/achievements/summary-tile';
import { CardsIcon } from '@/components/icons/cards-icon';
import { FlagIcon } from '@/components/icons/flag-icon';
import { MapCardIcon } from '@/components/icons/map-card-icon';
import { TrophyIcon } from '@/components/icons/trophy-icon';
import { WalkingIcon } from '@/components/icons/walking-icon';
import { TAB_BAR_BOTTOM_GAP, TAB_BAR_HEIGHT } from '@/components/tab-bar';
import { useCurrentUser } from '@/hooks/queries/use-current-user';
import { useCollectionCount, useMapFindsCount } from '@/hooks/queries/use-my-collection';
import { useUserTeam } from '@/hooks/queries/use-user-team';
import { colors } from '@/theme/colors';
import { listItemEntering } from '@/utils/list-loading';

const ICON_SIZE = 24;

/** Chave da conquista em `achievements.items` do i18n. */
type AchievementKey = 'firstTeamWin' | 'winStreak' | 'firstDiscovery' | 'collector' | 'flagHunter' | 'walker';

type Achievement = {
  key: AchievementKey;
  renderIcon: (color: string) => ReactNode;
  status: AchievementStatus;
  current?: number;
  target?: number;
};

/** Situação de uma conquista com meta: concluída ao chegar na meta. */
function progressStatus(current: number, target: number): AchievementStatus {
  return current >= target ? 'done' : 'progress';
}

/**
 * Conquistas: card "Meu time" (leva à edição do time), resumo (vitórias, conquistas do time e
 * individuais) e as listas. As do time esperam as partidas em equipe ("Em breve"); as individuais
 * usam o progresso real do jogador (cartas, bandeiras, quilômetros).
 */
export default function AchievementsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const team = useUserTeam();
  const user = useCurrentUser();
  const collectionCount = useCollectionCount();
  const mapFinds = useMapFindsCount();

  // Ao voltar para a aba: o time pode ter nascido agora (pacote de boas-vindas no mapa).
  const refetchTeam = team.refetch;
  useFocusEffect(
    useCallback(() => {
      void refetchTeam();
    }, [refetchTeam]),
  );

  const mapFindsCount = mapFinds.data ?? 0;
  const cardsCount = collectionCount.data ?? 0;
  const flags = user.data?.discoveryFlags ?? 0;
  const km = user.data?.distanceKm ?? 0;

  const teamAchievements: Achievement[] = [
    { key: 'firstTeamWin', renderIcon: (color) => <TrophyIcon color={color} size={ICON_SIZE} />, status: 'soon' },
    { key: 'winStreak', renderIcon: (color) => <TrophyIcon color={color} size={ICON_SIZE} />, status: 'soon' },
  ];

  const individualAchievements: Achievement[] = [
    {
      key: 'firstDiscovery',
      renderIcon: () => <MapCardIcon height={ICON_SIZE + 4} />,
      status: progressStatus(mapFindsCount, 1),
      current: mapFindsCount,
      target: 1,
    },
    {
      key: 'collector',
      renderIcon: (color) => <CardsIcon color={color} size={ICON_SIZE} />,
      status: progressStatus(cardsCount, 10),
      current: cardsCount,
      target: 10,
    },
    {
      key: 'flagHunter',
      renderIcon: (color) => <FlagIcon color={color} size={ICON_SIZE} />,
      status: progressStatus(flags, 3),
      current: flags,
      target: 3,
    },
    {
      key: 'walker',
      renderIcon: (color) => <WalkingIcon color={color} size={ICON_SIZE} />,
      status: progressStatus(km, 5),
      current: Math.floor(km),
      target: 5,
    },
  ];

  const teamDone = teamAchievements.filter((item) => item.status === 'done').length;
  const individualDone = individualAchievements.filter((item) => item.status === 'done').length;
  const individualPercent = Math.round((individualDone / individualAchievements.length) * 100);
  const wins = team.data?.wins ?? 0;
  const losses = team.data?.losses ?? 0;

  const refreshing = team.isRefetching || user.isRefetching;
  const refresh = () => {
    void team.refetch();
    void user.refetch();
    void collectionCount.refetch();
    void mapFinds.refetch();
  };

  const renderAchievement = (item: Achievement, index: number) => (
    <Animated.View key={item.key} entering={listItemEntering(index)}>
      <AchievementCard
        renderIcon={item.renderIcon}
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
        <MyTeamCard team={team.data} onPress={() => router.push('/edit-team')} />
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

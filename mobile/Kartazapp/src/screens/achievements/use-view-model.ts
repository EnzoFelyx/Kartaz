import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import type { AchievementStatus } from '@/components/achievements/achievement-card';
import { useCurrentUser } from '@/hooks/queries/use-current-user';
import { useCollectionCount, useMapFindsCount } from '@/hooks/queries/use-my-collection';
import { useUserTeam } from '@/hooks/queries/use-user-team';

/** Chave da conquista em `achievements.items` do i18n (a view escolhe o ícone por ela). */
export type AchievementKey = 'firstTeamWin' | 'winStreak' | 'firstDiscovery' | 'collector' | 'flagHunter' | 'walker';

export type Achievement = {
  key: AchievementKey;
  status: AchievementStatus;
  current?: number;
  target?: number;
};

/** Situação de uma conquista com meta: concluída ao chegar na meta. */
function progressStatus(current: number, target: number): AchievementStatus {
  return current >= target ? 'done' : 'progress';
}

/**
 * Conquistas: time do jogador, resumo (vitórias, conquistas do time e individuais) e as listas. As do
 * time esperam as partidas em equipe ("Em breve"); as individuais usam o progresso real do jogador.
 */
export function useAchievementsViewModel() {
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
    { key: 'firstTeamWin', status: 'soon' },
    { key: 'winStreak', status: 'soon' },
  ];

  const individualAchievements: Achievement[] = [
    { key: 'firstDiscovery', status: progressStatus(mapFindsCount, 1), current: mapFindsCount, target: 1 },
    { key: 'collector', status: progressStatus(cardsCount, 10), current: cardsCount, target: 10 },
    { key: 'flagHunter', status: progressStatus(flags, 3), current: flags, target: 3 },
    { key: 'walker', status: progressStatus(km, 5), current: Math.floor(km), target: 5 },
  ];

  const individualDone = individualAchievements.filter((item) => item.status === 'done').length;

  return {
    team: team.data,
    wins: team.data?.wins ?? 0,
    losses: team.data?.losses ?? 0,
    teamAchievements,
    teamDone: teamAchievements.filter((item) => item.status === 'done').length,
    individualAchievements,
    individualPercent: Math.round((individualDone / individualAchievements.length) * 100),
    refreshing: team.isRefetching || user.isRefetching,
    refresh: () => {
      void team.refetch();
      void user.refetch();
      void collectionCount.refetch();
      void mapFinds.refetch();
    },
    openTeam: () => router.push('/edit-team'),
  };
}

export type AchievementsViewModel = ReturnType<typeof useAchievementsViewModel>;

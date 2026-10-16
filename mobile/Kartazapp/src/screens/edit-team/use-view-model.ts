import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useNavigation } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { useSession } from '@/hooks/queries/use-session';
import { useUserTeam } from '@/hooks/queries/use-user-team';
import { patchUserTeam, type UserTeamDto } from '@/lib/api/team-api';
import { fetchAllUserInstances, type UserInstanceDto } from '@/lib/api/user-instances-api';
import { queryKeys } from '@/lib/query/keys';
import { computeTeamScore, pickBestLineup } from '@/lib/team/team-scoring';
import { toast } from '@/lib/toast/toast-store';
import { formatNumber } from '@/utils/card-labels';

/** Carrega o time; sem time (ainda sem o pacote de boas-vindas), a tela mostra o aviso. */
export function useEditTeamScreenViewModel() {
  const team = useUserTeam();
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/achievements'));
  return { team: team.data ?? null, loading: team.isPending, goBack };
}

function toScoring(instance: UserInstanceDto) {
  return { ovr: instance.card.ovr, nation: instance.card.nation, club: instance.card.team };
}

/**
 * Edição do time: rascunho do nome e dos 5 titulares (começa do servidor), overall recalculado na
 * hora, troca de jogador, montagem automática ("Auto"), salvar e confirmação ao sair sem salvar.
 */
export function useEditTeamViewModel(team: UserTeamDto, onDone: () => void) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { isReady } = useSession();

  const initialLineup = useMemo(() => team.slots.map((slot) => slot.instance), [team.slots]);
  const [name, setName] = useState(team.name);
  const [lineup, setLineup] = useState<UserInstanceDto[]>(initialLineup);
  const [pickingSlot, setPickingSlot] = useState<number | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [autoBuilding, setAutoBuilding] = useState(false);
  /** Depois de salvar, a saída não pede confirmação. */
  const leavingRef = useRef(false);

  const collection = useQuery({
    queryKey: queryKeys.userInstances.everything,
    queryFn: fetchAllUserInstances,
    enabled: isReady,
  });

  const nameChanged = name.trim() !== team.name;
  const lineupChanged = lineup.some((instance, index) => instance.id !== initialLineup[index]?.id);
  const dirty = nameChanged || lineupChanged;

  const score = useMemo(() => computeTeamScore(lineup.map(toScoring)), [lineup]);

  // Cartas que podem entrar na posição: fora do time e sem repetir um jogador que já é titular
  // nas outras posições (uma cópia por jogador, a de maior overall primeiro).
  const candidates = useMemo(() => {
    if (pickingSlot === null) return [];
    const inLineup = new Set(lineup.map((instance) => instance.id));
    const otherPlayers = new Set(lineup.filter((_, index) => index !== pickingSlot - 1).map((i) => i.cardId));
    const seen = new Set<number>();
    return (collection.data ?? [])
      .filter((instance) => !inLineup.has(instance.id) && !otherPlayers.has(instance.cardId))
      .sort((a, b) => (b.card.ovr ?? 0) - (a.card.ovr ?? 0))
      .filter((instance) => (seen.has(instance.cardId) ? false : (seen.add(instance.cardId), true)));
  }, [collection.data, lineup, pickingSlot]);

  const save = useMutation({
    mutationFn: () =>
      patchUserTeam({
        name: nameChanged ? name.trim() : undefined,
        instanceIds: lineupChanged ? lineup.map((instance) => instance.id) : undefined,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.userTeam });
      toast.success(t('team.savedTitle'), t('team.savedMessage'));
      leavingRef.current = true;
      onDone();
    },
    onError: () => toast.error(t('team.saveErrorTitle'), t('team.saveErrorMessage')),
  });

  const submit = () => {
    if (!name.trim()) {
      toast.warning(t('team.saveErrorTitle'), t('team.nameEmpty'));
      return;
    }
    save.mutate();
  };

  // Sair com alterações (voltar, gesto, botão do Android): confirma antes de descartar.
  useEffect(() => {
    return navigation.addListener('beforeRemove', (event) => {
      if (!dirty || leavingRef.current) return;
      event.preventDefault();
      Alert.alert(t('team.unsavedTitle'), t('team.unsavedMessage'), [
        { text: t('team.stay'), style: 'cancel' },
        {
          text: t('team.leave'),
          style: 'destructive',
          onPress: () => {
            leavingRef.current = true;
            navigation.dispatch(event.data.action);
          },
        },
      ]);
    });
  }, [navigation, dirty, t]);

  const choose = (instance: UserInstanceDto) => {
    if (pickingSlot === null) return;
    const slot = pickingSlot - 1;
    setLineup((current) => current.map((item, index) => (index === slot ? instance : item)));
    setPickingSlot(null);
  };

  // "Auto": monta a melhor escalação com as cartas do jogador (mesma regra de pontuação do servidor).
  // O cálculo roda no próximo quadro para o carregamento aparecer antes.
  const autoBuild = () => {
    const all = collection.data;
    if (!all || autoBuilding) return;
    setAutoBuilding(true);
    setTimeout(() => {
      const best = pickBestLineup(
        all.map((instance) => ({ id: instance.id, cardId: instance.cardId, ...toScoring(instance), instance })),
      );
      setAutoBuilding(false);
      if (!best) {
        toast.warning(t('team.autoNotEnoughTitle'), t('team.autoNotEnoughMessage'));
        return;
      }
      const next = best.map((item) => item.instance).sort((a, b) => (b.card.ovr ?? 0) - (a.card.ovr ?? 0));
      const nextScore = computeTeamScore(next.map(toScoring));
      if (nextScore.overall <= score.overall) {
        toast.info(t('team.autoAlreadyBestTitle'), t('team.autoAlreadyBestMessage', { overall: score.overall }));
        return;
      }
      setLineup(next);
      toast.success(
        t('team.autoDoneTitle'),
        t('team.autoDoneMessage', { overall: nextScore.overall, bonus: formatNumber(nextScore.bonusPercent) }),
      );
    }, 16);
  };

  return {
    name,
    setName,
    lineup,
    score,
    candidates,
    pickingSlot,
    openPicker: (slot: number) => setPickingSlot(slot),
    closePicker: () => setPickingSlot(null),
    choose,
    rulesOpen,
    openRules: () => setRulesOpen(true),
    closeRules: () => setRulesOpen(false),
    canSave: dirty && !save.isPending,
    saving: save.isPending,
    submit,
    canAutoBuild: !!collection.data && !autoBuilding,
    autoBuilding,
    autoBuild,
    onBack: onDone,
  };
}

export type EditTeamViewModel = ReturnType<typeof useEditTeamViewModel>;

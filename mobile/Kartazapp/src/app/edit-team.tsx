import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useNavigation } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HelpCircleIcon } from '@/components/icons/help-circle-icon';
import { SparklesIcon } from '@/components/icons/sparkles-icon';
import { LineupSlot } from '@/components/team/lineup-slot';
import { PlayerPickerModal } from '@/components/team/player-picker-modal';
import { TeamRulesModal } from '@/components/team/team-rules-modal';
import { IconButton } from '@/components/ui/icon-button';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TextField } from '@/components/ui/text-field';
import { useSession } from '@/hooks/queries/use-session';
import { useUserTeam } from '@/hooks/queries/use-user-team';
import { patchUserTeam, type UserTeamDto } from '@/lib/api/team-api';
import { fetchAllUserInstances, type UserInstanceDto } from '@/lib/api/user-instances-api';
import { queryKeys } from '@/lib/query/keys';
import { computeTeamScore, pickBestLineup } from '@/lib/team/team-scoring';
import { toast } from '@/lib/toast/toast-store';
import { colors, withAlpha } from '@/theme/colors';
import { formatNumber } from '@/utils/card-labels';
import { listItemEntering } from '@/utils/list-loading';

const NAME_MAX_LENGTH = 30;

/** Edição do time: nome, os 5 titulares (com troca) e o overall recalculado na hora. */
export default function EditTeamScreen() {
  const { t } = useTranslation();
  const team = useUserTeam();

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/achievements'));

  return (
    <View style={styles.container}>
      {team.data ? (
        // Remonta se o time mudar (ex.: salvo em outro aparelho): o rascunho começa do servidor.
        <TeamEditor key={team.data.id} team={team.data} onDone={goBack} />
      ) : (
        <>
          <ScreenHeader title={t('team.title')} align="center" onBack={goBack} />
          <View style={styles.center}>
            {team.isPending ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <>
                <Text style={styles.emptyTitle}>{t('team.noTeam')}</Text>
                <Text style={styles.emptyText}>{t('team.noTeamHint')}</Text>
              </>
            )}
          </View>
        </>
      )}
    </View>
  );
}

function TeamEditor({ team, onDone }: { team: UserTeamDto; onDone: () => void }) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { isReady } = useSession();

  const initialLineup = useMemo(() => team.slots.map((slot) => slot.instance), [team.slots]);
  const [name, setName] = useState(team.name);
  const [lineup, setLineup] = useState<UserInstanceDto[]>(initialLineup);
  const [pickingSlot, setPickingSlot] = useState<number | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);
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

  const score = useMemo(
    () =>
      computeTeamScore(
        lineup.map((instance) => ({ ovr: instance.card.ovr, nation: instance.card.nation, club: instance.card.team })),
      ),
    [lineup],
  );

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
  const [autoBuilding, setAutoBuilding] = useState(false);
  const autoBuild = () => {
    const all = collection.data;
    if (!all || autoBuilding) return;
    setAutoBuilding(true);
    setTimeout(() => {
      const best = pickBestLineup(
        all.map((instance) => ({
          id: instance.id,
          cardId: instance.cardId,
          ovr: instance.card.ovr,
          nation: instance.card.nation,
          club: instance.card.team,
          instance,
        })),
      );
      setAutoBuilding(false);
      if (!best) {
        toast.warning(t('team.autoNotEnoughTitle'), t('team.autoNotEnoughMessage'));
        return;
      }
      const next = best.map((item) => item.instance).sort((a, b) => (b.card.ovr ?? 0) - (a.card.ovr ?? 0));
      const nextScore = computeTeamScore(
        next.map((i) => ({ ovr: i.card.ovr, nation: i.card.nation, club: i.card.team })),
      );
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

  const canSave = dirty && !save.isPending;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader
        title={t('team.title')}
        align="center"
        onBack={onDone}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('team.save')}
            accessibilityState={{ disabled: !canSave, busy: save.isPending }}
            disabled={!canSave}
            onPress={submit}
            style={({ pressed }) => [styles.saveButton, canSave && styles.saveButtonActive, pressed && styles.pressed]}>
            {save.isPending ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <Text style={[styles.saveText, canSave && styles.saveTextActive]}>{t('team.save')}</Text>
            )}
          </Pressable>
        }
      />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
        <Animated.View entering={listItemEntering(0)}>
          <TextField
            label={t('team.nameLabel')}
            value={name}
            onChangeText={setName}
            placeholder={t('team.namePlaceholder')}
            maxLength={NAME_MAX_LENGTH}
          />
        </Animated.View>

        <Animated.View entering={listItemEntering(1)} style={styles.overallCard}>
          <View style={styles.overallRow}>
            <Text style={styles.overall}>{t('team.overall', { overall: score.overall })}</Text>
            <IconButton
              icon={<HelpCircleIcon color={colors.primary} size={22} />}
              accessibilityLabel={t('team.rulesTitle')}
              onPress={() => setRulesOpen(true)}
            />
          </View>
          <Text style={styles.overallBase}>
            {t('team.baseBonus', { base: score.baseSum, bonus: formatNumber(score.bonusPercent) })}
          </Text>
          <Text style={styles.overallSplit}>
            {t('team.bonusSplit', {
              nation: formatNumber(score.nationBonusPercent),
              club: formatNumber(score.clubBonusPercent),
            })}
          </Text>
          <Text style={styles.overallGroup}>
            {t('team.maxGroups', { nation: score.maxSameNation, club: score.maxSameClub })}
          </Text>
        </Animated.View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            {t('team.starters', { count: lineup.length })}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('team.autoA11y')}
            accessibilityState={{ disabled: !collection.data || autoBuilding, busy: autoBuilding }}
            disabled={!collection.data || autoBuilding}
            onPress={autoBuild}
            style={({ pressed }) => [styles.autoButton, (pressed || !collection.data) && styles.pressed]}>
            {autoBuilding ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <>
                <SparklesIcon color={colors.primary} size={18} />
                <Text style={styles.autoText}>{t('team.auto')}</Text>
              </>
            )}
          </Pressable>
        </View>
        {lineup.map((instance, index) => (
          <Animated.View key={`${index}-${instance.id}`} entering={listItemEntering(index + 2)}>
            <LineupSlot index={index + 1} instance={instance} onSwap={() => setPickingSlot(index + 1)} />
          </Animated.View>
        ))}
      </ScrollView>

      <PlayerPickerModal
        slotIndex={pickingSlot}
        candidates={candidates}
        onSelect={choose}
        onClose={() => setPickingSlot(null)}
      />
      <TeamRulesModal visible={rulesOpen} onClose={() => setRulesOpen(false)} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  saveButton: {
    minWidth: 76,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveButtonActive: {
    backgroundColor: withAlpha(colors.primary, 0.18),
    borderColor: withAlpha(colors.primary, 0.5),
  },
  saveText: {
    color: colors.mutedForeground,
    fontSize: 15,
    fontWeight: '800',
  },
  saveTextActive: {
    color: colors.primary,
  },
  pressed: {
    opacity: 0.8,
  },
  content: {
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  overallCard: {
    gap: 4,
    padding: 18,
    borderRadius: 20,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
  },
  overallRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  overall: {
    color: colors.primary,
    fontSize: 26,
    fontWeight: '900',
  },
  overallBase: {
    color: colors.secondaryForeground,
    fontSize: 14,
  },
  overallSplit: {
    color: colors.violet,
    fontSize: 13,
    fontWeight: '700',
  },
  overallGroup: {
    color: colors.mutedForeground,
    fontSize: 12,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sectionTitle: {
    color: colors.foreground,
    fontSize: 18,
    fontWeight: '800',
  },
  autoButton: {
    minWidth: 84,
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: withAlpha(colors.primary, 0.14),
    borderWidth: 1,
    borderColor: withAlpha(colors.primary, 0.5),
  },
  autoText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 32,
  },
  emptyTitle: {
    color: colors.foreground,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyText: {
    color: colors.secondaryForeground,
    fontSize: 14,
    textAlign: 'center',
  },
});

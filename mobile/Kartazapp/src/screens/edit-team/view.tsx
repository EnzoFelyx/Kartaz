import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
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

import { AutoLineupButton } from '@/components/team/auto-lineup-button';
import { LineupSlot } from '@/components/team/lineup-slot';
import { PlayerPickerModal } from '@/components/team/player-picker-modal';
import { TeamOverallCard } from '@/components/team/team-overall-card';
import { TeamRulesModal } from '@/components/team/team-rules-modal';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TextField } from '@/components/ui/text-field';
import { colors, withAlpha } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { listItemEntering } from '@/utils/list-loading';

import type { EditTeamViewModel } from './use-view-model';

const NAME_MAX_LENGTH = 30;

/** Sem time (ou carregando): cabeçalho e o aviso de que o time nasce com o pacote de boas-vindas. */
export function EditTeamEmptyView({ loading, onBack }: { loading: boolean; onBack: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <ScreenHeader title={t('team.title')} align="center" onBack={onBack} />
      <View style={styles.center}>
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <>
            <Text style={styles.emptyTitle}>{t('team.noTeam')}</Text>
            <Text style={styles.emptyText}>{t('team.noTeamHint')}</Text>
          </>
        )}
      </View>
    </View>
  );
}

/** Edição do time: nome, card do overall (com as regras no "?"), titulares com troca e o "Auto". */
export function EditTeamView({
  name,
  setName,
  lineup,
  score,
  candidates,
  pickingSlot,
  openPicker,
  closePicker,
  choose,
  rulesOpen,
  openRules,
  closeRules,
  canSave,
  saving,
  submit,
  canAutoBuild,
  autoBuilding,
  autoBuild,
  onBack,
}: EditTeamViewModel) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScreenHeader
          title={t('team.title')}
          align="center"
          onBack={onBack}
          right={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('team.save')}
              accessibilityState={{ disabled: !canSave, busy: saving }}
              disabled={!canSave}
              onPress={submit}
              style={({ pressed }) => [
                styles.saveButton,
                canSave && styles.saveButtonActive,
                pressed && styles.pressed,
              ]}>
              {saving ? (
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

          <TeamOverallCard score={score} onOpenRules={openRules} enteringIndex={1} />

          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              {t('team.starters', { count: lineup.length })}
            </Text>
            <AutoLineupButton disabled={!canAutoBuild} busy={autoBuilding} onPress={autoBuild} />
          </View>
          {lineup.map((instance, index) => (
            <Animated.View key={`${index}-${instance.id}`} entering={listItemEntering(index + 2)}>
              <LineupSlot index={index + 1} instance={instance} onSwap={() => openPicker(index + 1)} />
            </Animated.View>
          ))}
        </ScrollView>

        <PlayerPickerModal slotIndex={pickingSlot} candidates={candidates} onSelect={choose} onClose={closePicker} />
        <TeamRulesModal visible={rulesOpen} onClose={closeRules} />
      </KeyboardAvoidingView>
    </View>
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
    paddingHorizontal: spacing.screen,
    paddingTop: 20,
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

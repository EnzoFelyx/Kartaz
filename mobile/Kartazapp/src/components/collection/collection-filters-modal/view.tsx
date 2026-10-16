import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { ModalCard, ModalCloseButton } from '@/components/ui/modal-card';
import { RangeSlider } from '@/components/ui/range-slider';
import { TextField } from '@/components/ui/text-field';
import { OVR_MAX, OVR_MIN } from '@/lib/collection/collection-filters';
import { colors } from '@/theme/colors';

import type { CollectionFiltersViewModel } from './use-view-model';

/** Moldura do modal de filtros (com teclado e a raiz de gestos que o slider precisa). */
export function CollectionFiltersFrame({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    // `gestures`: o slider precisa da raiz de gestos (o Modal fica fora da do app).
    <ModalCard visible={visible} onClose={onClose} maxWidth={400} cardStyle={styles.card} keyboardAvoiding gestures>
      {children}
    </ModalCard>
  );
}

/** Faixa de overall (slider com dois thumbs), seleção, posição, origem e os botões Limpar / Aplicar. */
export function CollectionFiltersView({
  draft,
  liveRange,
  slideRange,
  changeRange,
  setNation,
  setPosition,
  setSpawnSource,
  clear,
  apply,
  onClose,
}: CollectionFiltersViewModel) {
  const { t } = useTranslation();

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" bounces={false}>
      <Text style={styles.title} accessibilityRole="header">
        {t('myCollection.filters.title')}
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t('myCollection.filters.ovr')}</Text>
        <Text style={styles.rangeValue}>
          {t('myCollection.filters.ovrRange', { min: liveRange.low, max: liveRange.high })}
        </Text>
        <RangeSlider
          min={OVR_MIN}
          max={OVR_MAX}
          low={draft.ovrMin}
          high={draft.ovrMax}
          onSlide={slideRange}
          onChange={changeRange}
          accessibilityLabel={t('myCollection.filters.ovr')}
        />
      </View>

      <TextField
        label={t('myCollection.filters.nation')}
        value={draft.nation}
        onChangeText={setNation}
        placeholder={t('myCollection.filters.nationPlaceholder')}
        autoCapitalize="words"
      />
      <TextField
        label={t('myCollection.filters.position')}
        value={draft.position}
        onChangeText={setPosition}
        placeholder={t('myCollection.filters.positionPlaceholder')}
        autoCapitalize="characters"
      />
      <TextField
        label={t('myCollection.filters.spawnSource')}
        value={draft.spawnSource}
        onChangeText={setSpawnSource}
        placeholder={t('myCollection.filters.spawnSourcePlaceholder')}
        autoCapitalize="none"
      />

      <View style={styles.actions}>
        <View style={styles.action}>
          <AuthButton label={t('myCollection.filters.clear')} variant="secondary" onPress={clear} />
        </View>
        <View style={styles.action}>
          <AuthButton label={t('myCollection.filters.apply')} onPress={apply} />
        </View>
      </View>

      <ModalCloseButton onPress={onClose} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    maxHeight: '90%',
    gap: 0,
    padding: 0,
  },
  content: {
    gap: 18,
    padding: 22,
  },
  title: {
    color: colors.foreground,
    fontSize: 20,
    fontWeight: '800',
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    color: colors.secondaryForeground,
    fontSize: 15,
    fontWeight: '700',
  },
  rangeValue: {
    color: colors.foreground,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  action: {
    flex: 1,
  },
});

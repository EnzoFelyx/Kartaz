import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthButton } from '@/components/auth/auth-button';
import { RangeSlider } from '@/components/ui/range-slider';
import { TextField } from '@/components/ui/text-field';
import {
  DEFAULT_COLLECTION_FILTERS,
  OVR_MAX,
  OVR_MIN,
  type CollectionFilters,
} from '@/lib/collection/collection-filters';
import { colors, withAlpha } from '@/theme/colors';

type CollectionFiltersModalProps = {
  visible: boolean;
  /** Filtros aplicados na lista (o modal começa com eles). */
  filters: CollectionFilters;
  onApply: (filters: CollectionFilters) => void;
  onClose: () => void;
};

/**
 * Filtros da coleção: faixa de overall (slider com dois thumbs), seleção, posição e origem da cópia.
 * Edita um rascunho; só "Aplicar" muda a lista. "Limpar" volta o rascunho ao padrão.
 */
export function CollectionFiltersModal({ visible, filters, onApply, onClose }: CollectionFiltersModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      {/* O Modal fica fora da raiz de gestos do app: precisa da própria para o slider funcionar. */}
      <GestureHandlerRootView style={styles.flex}>
        {/* Remonta a cada abertura: o rascunho começa nos filtros aplicados. */}
        {visible && <FiltersContent filters={filters} onApply={onApply} onClose={onClose} />}
      </GestureHandlerRootView>
    </Modal>
  );
}

function FiltersContent({ filters, onApply, onClose }: Omit<CollectionFiltersModalProps, 'visible'>) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(filters);
  /** Faixa mostrada no texto: acompanha o arraste ao vivo (o rascunho só muda ao soltar). */
  const [liveRange, setLiveRange] = useState({ low: filters.ovrMin, high: filters.ovrMax });

  const update = (patch: Partial<CollectionFilters>) => setDraft((current) => ({ ...current, ...patch }));

  const changeRange = (low: number, high: number) => {
    setLiveRange({ low, high });
    update({ ovrMin: low, ovrMax: high });
  };

  const clear = () => {
    setDraft(DEFAULT_COLLECTION_FILTERS);
    setLiveRange({ low: OVR_MIN, high: OVR_MAX });
  };

  const apply = () => {
    onApply(draft);
    onClose();
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(event) => event.stopPropagation()} accessibilityViewIsModal>
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
                onSlide={(low, high) => setLiveRange({ low, high })}
                onChange={changeRange}
                accessibilityLabel={t('myCollection.filters.ovr')}
              />
            </View>

            <TextField
              label={t('myCollection.filters.nation')}
              value={draft.nation}
              onChangeText={(nation) => update({ nation })}
              placeholder={t('myCollection.filters.nationPlaceholder')}
              autoCapitalize="words"
            />
            <TextField
              label={t('myCollection.filters.position')}
              value={draft.position}
              onChangeText={(position) => update({ position })}
              placeholder={t('myCollection.filters.positionPlaceholder')}
              autoCapitalize="characters"
            />
            <TextField
              label={t('myCollection.filters.spawnSource')}
              value={draft.spawnSource}
              onChangeText={(spawnSource) => update({ spawnSource })}
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

            <Pressable accessibilityRole="button" onPress={onClose} hitSlop={8} style={styles.closeButton}>
              <Text style={styles.closeText}>{t('myCollection.filters.close')}</Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: withAlpha(colors.deep, 0.7),
  },
  card: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    borderRadius: 22,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: withAlpha(colors.primary, 0.25),
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
  closeButton: {
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  closeText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
});

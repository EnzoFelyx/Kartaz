import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthButton } from '@/components/auth/auth-button';
import { NationLabel } from '@/components/collection/nation-label';
import { OvrBadge } from '@/components/collection/ovr-badge';
import { PlayerThumb } from '@/components/collection/player-thumb';
import { OfferCardRow } from '@/components/trades/offer-card-row';
import { ListState } from '@/components/ui/list-state';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SearchInput } from '@/components/ui/search-input';
import { colors, withAlpha } from '@/theme/colors';

import type { NewTradeViewModel } from './use-view-model';

const TARGET_THUMB_SIZE = 64;

/** A carta pedida ("Você quer"), a busca e a lista das cartas para oferecer, com o rodapé de envio. */
export function NewTradeView({
  target,
  serial,
  maxSerial,
  counterpartyName,
  query,
  setQuery,
  myCards,
  loading,
  loadError,
  retry,
  isSelected,
  isLocked,
  toggle,
  selectedCount,
  canSend,
  sending,
  send,
  goBack,
}: NewTradeViewModel) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <ScreenHeader title={t('trades.newTitle')} align="center" onBack={goBack} />

      <FlatList
        data={myCards}
        keyExtractor={(instance) => instance.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <View style={styles.targetCard}>
              <Text style={styles.targetLabel}>{t('trades.youWant')}</Text>
              <View style={styles.targetRow}>
                <PlayerThumb uri={target.imageUri} size={TARGET_THUMB_SIZE} />
                <View style={styles.targetTexts}>
                  <Text style={styles.targetName} numberOfLines={1}>
                    {target.name}
                  </Text>
                  <Text style={styles.targetSerial} numberOfLines={1}>
                    {t('trades.serialOwner', { serial, max: maxSerial, owner: counterpartyName })}
                  </Text>
                  <NationLabel nation={target.nation} />
                </View>
                {target.rating > 0 && <OvrBadge ovr={target.rating} variant="solid" style={styles.ovrBadge} />}
              </View>
            </View>

            <SearchInput value={query} onChangeText={setQuery} placeholder={t('trades.searchMine')} />
          </View>
        }
        ListEmptyComponent={
          <ListState
            loading={loading}
            error={loadError}
            onRetry={retry}
            emptyText={query.trim() ? t('trades.noMatch') : t('trades.noCards')}
          />
        }
        renderItem={({ item }) => (
          <OfferCardRow
            instance={item}
            selected={isSelected(item.id)}
            locked={isLocked(item.id)}
            onToggle={() => toggle(item.id)}
          />
        )}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Text style={styles.selectedCount}>{t('trades.selectedCount', { count: selectedCount })}</Text>
        <AuthButton label={t('trades.send')} onPress={send} loading={sending} disabled={!canSend} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerBlock: {
    gap: 16,
    marginBottom: 16,
  },
  targetCard: {
    gap: 10,
    padding: 16,
    borderRadius: 20,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: withAlpha(colors.primary, 0.3),
  },
  targetLabel: {
    color: colors.secondaryForeground,
    fontSize: 13,
    fontWeight: '700',
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  targetTexts: {
    flex: 1,
    gap: 3,
  },
  targetName: {
    color: colors.foreground,
    fontSize: 18,
    fontWeight: '800',
  },
  targetSerial: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  ovrBadge: {
    alignSelf: 'flex-start',
  },
  separator: {
    height: 12,
  },
  footer: {
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  selectedCount: {
    color: colors.secondaryForeground,
    fontSize: 13,
  },
});

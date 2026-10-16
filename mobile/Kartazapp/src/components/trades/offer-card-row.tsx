import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { NationLabel } from '@/components/collection/nation-label';
import { PlayerThumb } from '@/components/collection/player-thumb';
import { CheckCircleIcon } from '@/components/icons/check-circle-icon';
import { LockIcon } from '@/components/icons/lock-icon';
import { playerPhotoUri } from '@/lib/api/image-uri';
import type { UserInstanceDto } from '@/lib/api/user-instances-api';
import { colors, withAlpha } from '@/theme/colors';

const THUMB_SIZE = 56;
const CHECK_SIZE = 24;

type OfferCardRowProps = {
  instance: UserInstanceDto;
  selected: boolean;
  /** Titular do time: aparece, mas não pode ser oferecido. */
  locked: boolean;
  onToggle: () => void;
};

/**
 * Carta do usuário na "Nova troca": foto, nome, serial · overall, seleção e o círculo de marcar.
 * Titulares ficam apagados, com cadeado e o aviso "Titular do time".
 */
export function OfferCardRow({ instance, selected, locked, onToggle }: OfferCardRowProps) {
  const { t } = useTranslation();
  const { card } = instance;

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected, disabled: locked }}
      accessibilityLabel={`${card.name}, ${t('trades.serialOvr', {
        serial: instance.serialNumber,
        max: instance.serialMax,
        ovr: card.ovr ?? '—',
      })}${locked ? `, ${t('trades.starterLocked')}` : ''}`}
      disabled={locked}
      onPress={onToggle}
      style={({ pressed }) => [
        styles.row,
        selected && styles.rowSelected,
        locked && styles.rowLocked,
        pressed && styles.pressed,
      ]}>
      <PlayerThumb uri={playerPhotoUri(card.id, card.url)} size={THUMB_SIZE} />

      <View style={styles.texts}>
        <Text style={styles.name} numberOfLines={1}>
          {card.name}
        </Text>
        <Text style={styles.meta}>
          {t('trades.serialOvr', { serial: instance.serialNumber, max: instance.serialMax, ovr: card.ovr ?? '—' })}
        </Text>
        <NationLabel nation={card.nation} />
        {locked && <Text style={styles.locked}>{t('trades.starterLocked')}</Text>}
      </View>

      {locked ? (
        <LockIcon color={colors.mutedForeground} size={16} />
      ) : selected ? (
        <CheckCircleIcon color={colors.primary} size={CHECK_SIZE} />
      ) : (
        <View style={styles.circle} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 12,
    borderRadius: 18,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowSelected: {
    backgroundColor: withAlpha(colors.primary, 0.08),
    borderColor: withAlpha(colors.primary, 0.55),
  },
  rowLocked: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.8,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '800',
  },
  meta: {
    color: colors.secondaryForeground,
    fontSize: 13,
  },
  locked: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '700',
  },
  circle: {
    width: CHECK_SIZE,
    height: CHECK_SIZE,
    borderRadius: CHECK_SIZE / 2,
    borderWidth: 2,
    borderColor: colors.subtle,
  },
});

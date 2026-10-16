import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CardArtwork } from '@/components/collection/card-artwork';
import { CheckCircleIcon } from '@/components/icons/check-circle-icon';
import { LockIcon } from '@/components/icons/lock-icon';
import { playerPhotoUri } from '@/lib/api/image-uri';
import type { UserInstanceDto } from '@/lib/api/user-instances-api';
import { colors, withAlpha } from '@/theme/colors';
import { getNationName } from '@/utils/card-labels';
import { getFlagEmojiForCountry } from '@/utils/flags';

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
  const nation = card.nation?.trim() ?? '';
  const flag = nation ? getFlagEmojiForCountry(nation) : null;

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
      <View style={styles.thumb}>
        <CardArtwork uri={playerPhotoUri(card.id, card.url)} style={styles.photo} pointerEvents="none" />
      </View>

      <View style={styles.texts}>
        <Text style={styles.name} numberOfLines={1}>
          {card.name}
        </Text>
        <Text style={styles.meta}>
          {t('trades.serialOvr', { serial: instance.serialNumber, max: instance.serialMax, ovr: card.ovr ?? '—' })}
        </Text>
        {!!nation && (
          <Text style={styles.nation} numberOfLines={1}>
            {flag ? `${flag} ` : ''}
            {getNationName(nation)}
          </Text>
        )}
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
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    overflow: 'hidden',
    borderRadius: 14,
    backgroundColor: colors.secondary,
  },
  photo: {
    width: '100%',
    height: '100%',
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
  nation: {
    color: colors.violet,
    fontSize: 12,
    fontWeight: '700',
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

import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { CardArtwork } from '@/components/collection/card-artwork';
import { playerPhotoUri } from '@/lib/api/image-uri';
import type { UserInstanceDto } from '@/lib/api/user-instances-api';
import { colors, withAlpha } from '@/theme/colors';
import { getNationName } from '@/utils/card-labels';
import { getFlagEmojiForCountry } from '@/utils/flags';

const THUMB_SIZE = 52;
/** Largura de cada carta quando a proposta tem mais de uma (lista horizontal). */
export const TRADE_TILE_WIDTH = 236;

type TradeCardTileProps = {
  instance: UserInstanceDto;
  /** Uma carta só: ocupa a largura toda. Várias: largura fixa na lista horizontal. */
  fullWidth?: boolean;
};

/** Carta numa proposta de troca: foto, nome, serial, seleção e o overall em destaque. */
export function TradeCardTile({ instance, fullWidth = false }: TradeCardTileProps) {
  const { t } = useTranslation();
  const { card } = instance;
  const nation = card.nation?.trim() ?? '';
  const flag = nation ? getFlagEmojiForCountry(nation) : null;

  return (
    <View
      style={[styles.tile, fullWidth ? styles.full : { width: TRADE_TILE_WIDTH }]}
      accessible
      accessibilityLabel={`${card.name}, ${t('trades.serial', { serial: instance.serialNumber, max: instance.serialMax })}, OVR ${card.ovr ?? '—'}`}>
      <View style={styles.thumb}>
        <CardArtwork uri={playerPhotoUri(card.id, card.url)} style={styles.photo} pointerEvents="none" />
      </View>
      <View style={styles.texts}>
        <Text style={styles.name} numberOfLines={1}>
          {card.name}
        </Text>
        <Text style={styles.serial}>
          {t('trades.serial', { serial: instance.serialNumber, max: instance.serialMax })}
        </Text>
        {!!nation && (
          <Text style={styles.nation} numberOfLines={1}>
            {flag ? `${flag} ` : ''}
            {getNationName(nation)}
          </Text>
        )}
      </View>
      <View style={styles.ovrBadge}>
        <Text style={styles.ovrText}>{card.ovr ?? '—'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 16,
    backgroundColor: withAlpha(colors.primary, 0.06),
    borderWidth: 1,
    borderColor: withAlpha(colors.primary, 0.3),
  },
  full: {
    alignSelf: 'stretch',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    overflow: 'hidden',
    borderRadius: 12,
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
    fontSize: 15,
    fontWeight: '800',
  },
  serial: {
    color: colors.secondaryForeground,
    fontSize: 12,
  },
  nation: {
    color: colors.violet,
    fontSize: 12,
    fontWeight: '700',
  },
  ovrBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: withAlpha(colors.primary, 0.15),
    borderWidth: 1,
    borderColor: withAlpha(colors.primary, 0.5),
  },
  ovrText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
});

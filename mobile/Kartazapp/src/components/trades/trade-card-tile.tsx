import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { NationLabel } from '@/components/collection/nation-label';
import { OvrBadge } from '@/components/collection/ovr-badge';
import { PlayerThumb } from '@/components/collection/player-thumb';
import { playerPhotoUri } from '@/lib/api/image-uri';
import type { UserInstanceDto } from '@/lib/api/user-instances-api';
import { colors, withAlpha } from '@/theme/colors';

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

  return (
    <View
      style={[styles.tile, fullWidth ? styles.full : { width: TRADE_TILE_WIDTH }]}
      accessible
      accessibilityLabel={`${card.name}, ${t('trades.serial', { serial: instance.serialNumber, max: instance.serialMax })}, OVR ${card.ovr ?? '—'}`}>
      <PlayerThumb uri={playerPhotoUri(card.id, card.url)} size={THUMB_SIZE} radius={12} />
      <View style={styles.texts}>
        <Text style={styles.name} numberOfLines={1}>
          {card.name}
        </Text>
        <Text style={styles.serial}>
          {t('trades.serial', { serial: instance.serialNumber, max: instance.serialMax })}
        </Text>
        <NationLabel nation={card.nation} />
      </View>
      <OvrBadge ovr={card.ovr} variant="outline" />
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
});

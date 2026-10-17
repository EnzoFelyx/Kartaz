import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { CardArtwork } from '@/components/collection/card-artwork';
import { StarIcon } from '@/components/icons/star-icon';
import { EntranceView } from '@/components/ui/entrance-view';
import type { EntranceOptions } from '@/hooks/use-entrance-style';
import type { Player } from '@/types/player-card';
import { colors, withAlpha } from '@/theme/colors';
import { rarityColors } from '@/theme/game-colors';
import { getNationName, getPositionLabel } from '@/utils/card-labels';

/** Foto da carta no topo (mesmas medidas do projeto de referência, proporção 5:7). */
const ARTWORK_WIDTH = 80;
const ARTWORK_HEIGHT = 112;

type CardIdentityProps = {
  card: Player;
  /** Entrada do bloco (nome e foto) e, antes dele, das badges. */
  entrance: EntranceOptions;
  badgesEntrance: EntranceOptions;
};

/** Topo do detalhe: badges (raridade, posição, overall), nome e clube à esquerda; a foto à direita. */
export function CardIdentity({ card, entrance, badgesEntrance }: CardIdentityProps) {
  const { t } = useTranslation();
  const tint = rarityColors[card.rarity];

  return (
    <EntranceView {...entrance} style={styles.identity}>
      <View style={styles.names}>
        <EntranceView {...badgesEntrance} style={styles.badges}>
          <View style={[styles.rarityPill, { backgroundColor: tint }]}>
            <StarIcon color={colors.background} size={12} />
            <Text style={styles.rarityText}>{t(`rarity.${card.rarity}`)}</Text>
          </View>
          {!!card.position && (
            <View style={styles.infoPill}>
              <Text style={styles.positionText}>{getPositionLabel(card.position)}</Text>
            </View>
          )}
          <View style={styles.infoPill} accessible accessibilityLabel={t('common.ratingA11y', { rating: card.rating })}>
            <Text style={styles.ratingText}>{card.rating}</Text>
          </View>
        </EntranceView>
        <Text style={styles.name} accessibilityRole="header" numberOfLines={1} adjustsFontSizeToFit>
          {card.name}
        </Text>
        {/* Clube quando a base informa; senão, a seleção. */}
        <Text style={styles.team} numberOfLines={1}>
          {card.team || getNationName(card.nation)}
        </Text>
      </View>

      <View style={styles.artwork}>
        <CardArtwork uri={card.imageUri} style={StyleSheet.absoluteFill} pointerEvents="none" />
      </View>
    </EntranceView>
  );
}

const styles = StyleSheet.create({
  identity: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 16,
  },
  names: {
    flex: 1,
    minWidth: 0,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  rarityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  rarityText: {
    color: colors.background,
    fontSize: 13,
    fontWeight: '800',
  },
  infoPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: withAlpha(colors.primary, 0.3),
  },
  positionText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  ratingText: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: '800',
  },
  name: {
    marginBottom: 4,
    color: colors.foreground,
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '800',
  },
  team: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  artwork: {
    width: ARTWORK_WIDTH,
    height: ARTWORK_HEIGHT,
    overflow: 'hidden',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
});

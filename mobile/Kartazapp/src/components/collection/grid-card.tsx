import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StarIcon } from '@/components/icons/star-icon';
import { SvgGradientRect } from '@/components/ui/svg-gradient-rect';
import type { Player, Rarity } from '@/types/player-card';
import { colors } from '@/theme/colors';
import { formatNumber, getNationName } from '@/utils/card-labels';

import { CardArtwork } from './card-artwork';
import { OvrBadge } from './ovr-badge';

const BORDER_WIDTH = 1;
const CARD_RADIUS = 16;
const OUTER_RADIUS = CARD_RADIUS + BORDER_WIDTH;
const IMAGE_HEIGHT = 160;

/** Gradiente da borda por raridade. */
const RARITY_GRADIENT: Record<Rarity, [string, string]> = {
  legendary: [colors.fuelEnd, colors.gold],
  epic: [colors.violet, colors.magenta],
  rare: [colors.info, colors.violet],
  common: [colors.primary, colors.progressEnd],
};

type GridCardProps = {
  card: Player;
  onPress?: () => void;
};

/**
 * Carta na visualização em grade (layout do projeto de referência): borda em gradiente
 * pela raridade, foto com overall, raridade, rank e bandeira, e nome / seleção / encontradas.
 */
export function GridCard({ card, onPress }: GridCardProps) {
  const { t } = useTranslation();
  const [start, end] = RARITY_GRADIENT[card.rarity];
  const nation = getNationName(card.nation);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('cards.tileA11y', {
        name: card.name,
        nation,
        rating: card.rating,
        rarity: t(`rarity.${card.rarity}`),
      })}
      onPress={onPress}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}>
      <View style={styles.outer}>
        {/* Borda em gradiente diagonal: SVG em % (sem medir o card), mais leve que um Canvas Skia por card. */}
        <SvgGradientRect id="border" colors={[start, end]} radius={OUTER_RADIUS} />

        <View style={styles.inner}>
          <View style={styles.imageWrap}>
            <CardArtwork uri={card.imageUri} style={styles.image} pointerEvents="none" />
            {card.flagEmoji && (
              <View style={styles.flagBadge}>
                <Text style={styles.flagText}>{card.flagEmoji}</Text>
              </View>
            )}
            {card.rank != null && (
              <View style={styles.rankPill}>
                <Text style={styles.rankText}>#{card.rank}</Text>
              </View>
            )}
            <OvrBadge ovr={card.rating} style={styles.ratingBadge} />
            <View style={[styles.rarityBadge, { backgroundColor: start }]}>
              <StarIcon color={colors.white} size={10} />
            </View>
          </View>

          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>
              {card.name}
            </Text>
            <Text style={styles.nation} numberOfLines={1}>
              {nation}
            </Text>
            <Text style={styles.found} numberOfLines={1}>
              {t('cards.found', {
                found: formatNumber(card.copiesFound),
                total: formatNumber(card.totalCopies),
              })}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
    minWidth: 0,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
  outer: {
    width: '100%',
    minHeight: 220,
    padding: BORDER_WIDTH,
    overflow: 'hidden',
    borderRadius: OUTER_RADIUS,
  },
  inner: {
    flex: 1,
    zIndex: 1,
    overflow: 'hidden',
    borderRadius: CARD_RADIUS,
    backgroundColor: colors.card,
  },
  imageWrap: {
    height: IMAGE_HEIGHT,
    width: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
    borderTopLeftRadius: CARD_RADIUS,
    borderTopRightRadius: CARD_RADIUS,
  },
  flagBadge: {
    position: 'absolute',
    right: 4,
    bottom: 0,
  },
  flagText: {
    fontSize: 26,
  },
  rankPill: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.fuelEnd,
  },
  rankText: {
    color: colors.fuelEnd,
    fontSize: 11,
    fontWeight: '700',
  },
  ratingBadge: {
    position: 'absolute',
    left: 8,
    top: 8,
  },
  rarityBadge: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    shadowColor: colors.background,
    shadowOpacity: 0.4,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  info: {
    padding: 12,
    backgroundColor: colors.card,
  },
  name: {
    marginBottom: 4,
    color: colors.foreground,
    fontSize: 14,
    fontWeight: '700',
  },
  nation: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  found: {
    marginTop: 4,
    color: colors.secondaryForeground,
    fontSize: 11,
    fontWeight: '600',
  },
});

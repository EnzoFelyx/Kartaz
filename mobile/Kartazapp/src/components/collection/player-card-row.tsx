import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StarIcon } from '@/components/icons/star-icon';
import type { Player } from '@/types/player-card';
import { formatNumber, getNationName } from '@/utils/card-labels';
import { colors } from '@/theme/colors';
import { rarityColors } from '@/theme/game-colors';

import { CardArt } from './card-art';

type PlayerCardRowProps = {
  /** Aceita qualquer jogador (catálogo) ou cópia da coleção. */
  card: Player;
  onPress?: () => void;
};

/**
 * Carta na visualização em lista: arte à esquerda, nome / seleção / raridade
 * no meio e o overall em destaque à direita. Borda na cor da raridade.
 */
export function PlayerCardRow({ card, onPress }: PlayerCardRowProps) {
  const { t } = useTranslation();
  const tint = rarityColors[card.rarity];
  const rarity = t(`rarity.${card.rarity}`);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('cards.rowA11y', {
        name: card.name,
        nation: getNationName(card.nation),
        rarity,
        rating: card.rating,
        found: card.copiesFound,
        total: card.totalCopies,
      })}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { borderColor: tint, shadowColor: tint },
        pressed && styles.pressed,
      ]}>
      <CardArt
        rarity={card.rarity}
        nation={card.nation}
        position={card.position}
        imageUri={card.imageUri}
        codeSize={22}
        style={styles.thumb}
      />

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {card.name}
        </Text>
        <Text style={styles.nation} numberOfLines={1}>
          {getNationName(card.nation)}
        </Text>
        <View style={styles.rarityRow}>
          <StarIcon color={tint} size={13} />
          <Text style={styles.rarity}>{rarity}</Text>
        </View>
        <Text style={styles.found}>
          {t('cards.found', {
            found: formatNumber(card.copiesFound),
            total: formatNumber(card.totalCopies),
          })}
        </Text>
      </View>

      <View style={styles.ratingBox}>
        <Text style={styles.rating}>{card.rating}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 14,
    borderRadius: 18,
    borderWidth: 2,
    backgroundColor: colors.card,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  thumb: {
    width: 88,
    height: 88,
    borderRadius: 14,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    color: colors.foreground,
    fontSize: 17,
    fontWeight: '800',
  },
  nation: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  rarityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  rarity: {
    color: colors.secondaryForeground,
    fontSize: 13,
    fontWeight: '600',
  },
  found: {
    color: colors.secondaryForeground,
    fontSize: 13,
    fontWeight: '500',
  },
  ratingBox: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  rating: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '800',
  },
});

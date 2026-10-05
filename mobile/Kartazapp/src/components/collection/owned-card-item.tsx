import { Pressable, StyleSheet, Text, View } from 'react-native';

import { STAT_CONFIG } from '@/components/card-details/stat-config';
import { CalendarIcon } from '@/components/icons/calendar-icon';
import { ChevronRightIcon } from '@/components/icons/chevron-right-icon';
import { MapPinIcon } from '@/components/icons/map-pin-icon';
import { MessageCircleIcon } from '@/components/icons/message-circle-icon';
import type { PlayerCard } from '@/types/player-card';
import { formatShortDate, RARITY_LABEL } from '@/utils/card-labels';
import { colors, rarityColors, withAlpha } from '@/theme/colors';

import { CardArt } from './card-art';

const THUMB_SIZE = 88;
const STAT_ICON_SIZE = 16;
const META_ICON_SIZE = 15;

type OwnedCardItemProps = {
  card: PlayerCard;
  onPress?: () => void;
  /** Ação de ver propostas de troca desta cópia (demonstrativa por enquanto). */
  onViewOffers?: () => void;
};

/**
 * Cópia de carta da coleção do jogador: identidade + raridade no topo,
 * arte com o serial da cópia (ex.: 384 / 1000), dados da coleta, propostas
 * de troca e os atributos resumidos.
 */
export function OwnedCardItem({ card, onPress, onViewOffers }: OwnedCardItemProps) {
  const tint = rarityColors[card.rarity];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${card.name}, ${RARITY_LABEL[card.rarity]}, copy ${card.serial} of ${card.maxSerial}, rating ${card.rating}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>
          {card.name}
        </Text>
        <Text style={styles.rating}>{card.rating}</Text>
        <View style={[styles.rarityPill, { backgroundColor: tint }]}>
          <Text style={styles.rarityText}>{RARITY_LABEL[card.rarity]}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.thumb}>
          <CardArt
            rarity={card.rarity}
            nationCode={card.nationCode}
            position={card.position}
            codeSize={22}
            style={StyleSheet.absoluteFill}
          />
          {/* Serial desta cópia. */}
          <View style={styles.serialBar}>
            <Text style={styles.serial}>
              {card.serial} / {card.maxSerial}
            </Text>
          </View>
        </View>

        <View style={styles.meta}>
          <View style={styles.metaRow}>
            <CalendarIcon color={colors.secondaryForeground} size={META_ICON_SIZE} />
            <Text style={styles.metaText}>{formatShortDate(card.collectedAt)}</Text>
          </View>
          <View style={styles.metaRow}>
            <MapPinIcon color={colors.secondaryForeground} size={META_ICON_SIZE} />
            <Text style={styles.metaText} numberOfLines={1}>
              {card.collectedLocation}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <MessageCircleIcon color={colors.secondaryForeground} size={META_ICON_SIZE} />
            <Text style={styles.metaText}>{card.tradeOffers}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`View ${card.tradeOffers} trade offers`}
              onPress={onViewOffers}
              hitSlop={8}
              style={styles.offersLink}>
              <Text style={styles.offersText}>View offers</Text>
              <ChevronRightIcon color={colors.primary} size={14} />
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.stats}>
        {STAT_CONFIG.map((stat) => (
          <View key={stat.key} style={styles.stat} accessible accessibilityLabel={`${stat.label} ${card.stats[stat.key]}`}>
            {stat.renderIcon(STAT_ICON_SIZE)}
            <Text style={styles.statValue}>{card.stats[stat.key]}</Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderRadius: 20,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.secondary,
  },
  name: {
    flex: 1,
    color: colors.foreground,
    fontSize: 18,
    fontWeight: '800',
  },
  rating: {
    color: colors.foreground,
    fontSize: 18,
    fontWeight: '800',
  },
  rarityPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  rarityText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '800',
  },
  body: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    overflow: 'hidden',
    borderRadius: 14,
  },
  serialBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: 4,
    alignItems: 'center',
    backgroundColor: withAlpha(colors.background, 0.7),
  },
  serial: {
    color: colors.foreground,
    fontSize: 12,
    fontWeight: '800',
  },
  meta: {
    flex: 1,
    justifyContent: 'center',
    gap: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    flexShrink: 1,
    color: colors.foreground,
    fontSize: 14,
    fontWeight: '600',
  },
  offersLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 'auto',
  },
  offersText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statValue: {
    color: colors.foreground,
    fontSize: 15,
    fontWeight: '800',
  },
});

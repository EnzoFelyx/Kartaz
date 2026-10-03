import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { ScrollView, Share, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CardHero } from '@/components/card-details/card-hero';
import { StatRow } from '@/components/card-details/stat-row';
import { ActivityIcon } from '@/components/icons/activity-icon';
import { ArrowLeftIcon } from '@/components/icons/arrow-left-icon';
import { BoltIcon } from '@/components/icons/bolt-icon';
import { HeartIcon } from '@/components/icons/heart-icon';
import { ShareIcon } from '@/components/icons/share-icon';
import { ShieldIcon } from '@/components/icons/shield-icon';
import { StarIcon } from '@/components/icons/star-icon';
import { TargetIcon } from '@/components/icons/target-icon';
import { EdgeFade } from '@/components/ui/edge-fade';
import { IconButton } from '@/components/ui/icon-button';
import { getPlayerCardById } from '@/mocks/player-cards';
import type { PlayerStats, Rarity } from '@/types/player-card';
import { colors, rarityColors } from '@/theme/colors';

const RARITY_LABEL: Record<Rarity, string> = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

const POSITION_ROLE: Record<string, string> = {
  GK: 'Goalkeeper',
  CB: 'Defender',
  LB: 'Defender',
  RB: 'Defender',
  CDM: 'Midfielder',
  CM: 'Midfielder',
  CAM: 'Midfielder',
  LW: 'Forward',
  RW: 'Forward',
  ST: 'Forward',
};

const STAT_ICON_SIZE = 20;

/** Ordem, nome, cor e ícone de cada atributo exibido. */
const STAT_ROWS: { key: keyof PlayerStats; label: string; color: string; icon: (color: string) => ReactNode }[] = [
  { key: 'speed', label: 'Speed', color: colors.gold, icon: (c) => <BoltIcon color={c} size={STAT_ICON_SIZE} /> },
  { key: 'shooting', label: 'Shooting', color: colors.danger, icon: (c) => <TargetIcon color={c} size={STAT_ICON_SIZE} /> },
  { key: 'passing', label: 'Passing', color: colors.success, icon: (c) => <ShareIcon color={c} size={STAT_ICON_SIZE} /> },
  { key: 'dribbling', label: 'Dribbling', color: colors.violet, icon: (c) => <StarIcon color={c} size={STAT_ICON_SIZE} /> },
  { key: 'defense', label: 'Defense', color: colors.info, icon: (c) => <ShieldIcon color={c} size={STAT_ICON_SIZE} /> },
  { key: 'physical', label: 'Physical', color: colors.accent, icon: (c) => <ActivityIcon color={c} size={STAT_ICON_SIZE} /> },
];

const STAT_STAGGER_MS = 70;
/** Altura do fade no topo da área rolável (Statistics). */
const SCROLL_FADE_HEIGHT = 36;

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function CardDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  // Favorito local por enquanto (no futuro: intenção enviada ao servidor).
  const [favorite, setFavorite] = useState(false);

  const card = id ? getPlayerCardById(id) : undefined;

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/collection'));

  if (!card) {
    return (
      <View style={[styles.container, styles.notFound]}>
        <Text style={styles.notFoundText}>Card not found</Text>
        <IconButton
          icon={<ArrowLeftIcon color={colors.foreground} />}
          accessibilityLabel="Go back"
          onPress={goBack}
        />
      </View>
    );
  }

  const tint = rarityColors[card.rarity];

  const handleShare = () => {
    Share.share({
      message: `${card.name} (${card.nation}) — ${RARITY_LABEL[card.rarity]} #${card.serial}/${card.maxSerial} on Kartaz`,
    });
  };

  return (
    <View style={styles.container}>
      {/* Header fixo: arte + identidade do jogador. Só o conteúdo abaixo rola. */}
      <CardHero card={card} height={Math.round(windowHeight * 0.48)}>
        <View style={styles.badges}>
          <View style={[styles.rarityPill, { backgroundColor: tint }]}>
            <StarIcon color={colors.background} size={12} />
            <Text style={styles.rarityText}>{RARITY_LABEL[card.rarity]}</Text>
          </View>
          <View style={styles.rolePill}>
            <Text style={styles.roleText}>{POSITION_ROLE[card.position] ?? card.position}</Text>
          </View>
        </View>

        <View style={styles.identity}>
          <View style={styles.names}>
            <Text style={styles.name} accessibilityRole="header" numberOfLines={2}>
              {card.name}
            </Text>
            <Text style={styles.nation}>{card.nation}</Text>
          </View>
          <View style={styles.ratingBox} accessible accessibilityLabel={`Rating ${card.rating}`}>
            <Text style={styles.rating}>{card.rating}</Text>
          </View>
        </View>
      </CardHero>

      <View style={styles.scrollArea}>
        <ScrollView
          contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          {STAT_ROWS.map((stat, index) => (
            <Animated.View key={stat.key} entering={FadeInDown.delay(index * STAT_STAGGER_MS).duration(350)}>
              <StatRow
                label={stat.label}
                value={card.stats[stat.key]}
                color={stat.color}
                icon={stat.icon(stat.color)}
              />
            </Animated.View>
          ))}

          <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Card info</Text>
          <View style={styles.infoCard}>
            <InfoRow label="Serial" value={`#${card.serial} / ${card.maxSerial}`} />
            <InfoRow label="Position" value={card.position} />
            <InfoRow label="Collected" value={formatDate(card.collectedAt)} last />
          </View>
        </ScrollView>

        {/* O conteúdo vai sumindo ao subir por baixo do header. */}
        <EdgeFade edge="top" height={SCROLL_FADE_HEIGHT} />
      </View>

      {/* Ações fixas no topo, por cima da arte. */}
      <View style={[styles.topBar, { top: insets.top + 8 }]} pointerEvents="box-none">
        <IconButton
          icon={<ArrowLeftIcon color={colors.foreground} />}
          accessibilityLabel="Go back"
          onPress={goBack}
        />
        <View style={styles.topActions}>
          <IconButton
            icon={<HeartIcon color={favorite ? colors.danger : colors.foreground} filled={favorite} />}
            accessibilityLabel={favorite ? 'Remove from favorites' : 'Add to favorites'}
            selected={favorite}
            onPress={() => setFavorite((value) => !value)}
          />
          <IconButton
            icon={<ShareIcon color={colors.foreground} />}
            accessibilityLabel="Share card"
            onPress={handleShare}
          />
        </View>
      </View>
    </View>
  );
}

function InfoRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.infoRow, !last && styles.infoDivider]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  notFound: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  notFoundText: {
    color: colors.mutedForeground,
    fontSize: 16,
  },
  topBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  topActions: {
    flexDirection: 'row',
    gap: 12,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
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
  rolePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
  },
  names: {
    flex: 1,
    gap: 4,
  },
  name: {
    color: colors.foreground,
    fontSize: 32,
    fontWeight: '900',
  },
  nation: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  ratingBox: {
    width: 76,
    height: 76,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.background,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
  },
  rating: {
    color: colors.white,
    fontSize: 30,
    fontWeight: '900',
  },
  scrollArea: {
    flex: 1,
  },
  body: {
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: SCROLL_FADE_HEIGHT / 2 + 12,
  },
  sectionTitle: {
    color: colors.secondaryForeground,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  sectionSpacing: {
    marginTop: 16,
  },
  infoCard: {
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  infoDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    color: colors.mutedForeground,
    fontSize: 14,
    fontWeight: '600',
  },
  infoValue: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: '700',
  },
});

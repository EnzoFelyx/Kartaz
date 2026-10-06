import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlobalDiscoveryButton } from '@/components/card-details/global-discovery-button';
import { CardHero } from '@/components/card-details/card-hero';
import { SimilarCardTile } from '@/components/card-details/similar-card-tile';
import { CardArtwork } from '@/components/collection/card-artwork';
import { StatRow } from '@/components/card-details/stat-row';
import { ArrowLeftIcon } from '@/components/icons/arrow-left-icon';
import { HeartIcon } from '@/components/icons/heart-icon';
import { ShareIcon } from '@/components/icons/share-icon';
import { StarIcon } from '@/components/icons/star-icon';
import { EdgeFade } from '@/components/ui/edge-fade';
import { IconButton } from '@/components/ui/icon-button';
import { STAT_CONFIG } from '@/components/card-details/stat-config';
import { useOwnedCopy } from '@/hooks/queries/use-my-collection';
import { usePlayer, useSimilarPlayers } from '@/hooks/queries/use-player';
import { formatShortDate, getNationName, getPositionLabel, getPositionName } from '@/utils/card-labels';
import { colors, rarityColors, withAlpha } from '@/theme/colors';

const STAT_ICON_SIZE = 20;
/** Foto da carta no topo (mesmas medidas do projeto de referência, proporção 5:7). */
const HERO_ARTWORK_WIDTH = 80;
const HERO_ARTWORK_HEIGHT = 112;

/** Altura do fade no topo da área rolável (Statistics). */
const SCROLL_FADE_HEIGHT = 36;

/**
 * Entrada da tela, igual ao projeto de referência: cada bloco aparece subindo, em sequência.
 * Topo: badges → linha nome/foto → descoberta global; abaixo, a seção de estatísticas,
 * e por fim as barras dos atributos enchem.
 */
const ENTRANCE = {
  badges: { delay: 100, offset: 24 },
  identity: { delay: 220, offset: 24 },
  discovery: { delay: 380, offset: 24 },
  stats: { delay: 150, offset: 20, duration: 350 },
  /** Barras dos atributos começam a encher depois que a seção já apareceu. */
  statBarsDelay: 450,
} as const;
const ENTRANCE_DURATION = 320;

/** Opacidade 0 → 1 subindo `offset` px, após `delay` ms, quando `ready`. */
function useEntranceStyle(ready: boolean, delay: number, offset: number, duration: number = ENTRANCE_DURATION) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!ready) return;
    progress.value = withDelay(delay, withTiming(1, { duration, easing: Easing.out(Easing.cubic) }));
  }, [ready, delay, duration, progress]);

  return useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (progress.value - 1) * offset }],
  }));
}

export default function CardDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  // Favorito local por enquanto (no futuro: intenção enviada ao servidor).
  const [favorite, setFavorite] = useState(false);

  // Jogador vem da base local (SQLite); a cópia do usuário (serial, coleta) vem da API.
  const playerId = Number(id);
  const player = usePlayer(playerId);
  const ownedCopy = useOwnedCopy(playerId);
  const similar = useSimilarPlayers(playerId);

  const card = player.data;
  const owned = ownedCopy.data;

  // A sequência começa quando o jogador está pronto (não durante o loading).
  const ready = !!card;
  const badgesStyle = useEntranceStyle(ready, ENTRANCE.badges.delay, ENTRANCE.badges.offset);
  const identityStyle = useEntranceStyle(ready, ENTRANCE.identity.delay, ENTRANCE.identity.offset);
  const discoveryStyle = useEntranceStyle(ready, ENTRANCE.discovery.delay, ENTRANCE.discovery.offset);
  const statsStyle = useEntranceStyle(ready, ENTRANCE.stats.delay, ENTRANCE.stats.offset, ENTRANCE.stats.duration);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/collection'));

  if (player.isPending && Number.isInteger(playerId) && playerId > 0) {
    return (
      <View style={[styles.container, styles.notFound]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!card) {
    return (
      <View style={[styles.container, styles.notFound]}>
        <Text style={styles.notFoundText}>{t('cardDetails.notFound')}</Text>
        <IconButton
          icon={<ArrowLeftIcon color={colors.foreground} />}
          accessibilityLabel={t('common.goBack')}
          onPress={goBack}
        />
      </View>
    );
  }

  const tint = rarityColors[card.rarity];
  const rarity = t(`rarity.${card.rarity}`);
  const nation = getNationName(card.nation);

  const openSimilar = (similarId: number) =>
    router.push({ pathname: '/card/[id]', params: { id: String(similarId) } });

  const handleShare = () => {
    Share.share({
      message: t('cardDetails.shareMessage', {
        name: card.name,
        nation,
        rarity,
        serial: owned?.serial ?? '—',
        total: owned?.maxSerial ?? card.totalCopies,
      }),
    });
  };

  return (
    <View style={styles.container}>
      {/* Header fixo: arena + identidade do jogador. Só o conteúdo abaixo rola. */}
      <CardHero height={Math.round(windowHeight * 0.48)}>
        {/* Badges, nome e clube à esquerda; a carta com a foto à direita. */}
        <Animated.View style={[styles.identity, identityStyle]}>
          <View style={styles.names}>
            <Animated.View style={[styles.badges, badgesStyle]}>
              <View style={[styles.rarityPill, { backgroundColor: tint }]}>
                <StarIcon color={colors.background} size={12} />
                <Text style={styles.rarityText}>{rarity}</Text>
              </View>
              {!!card.position && (
                <View style={styles.infoPill}>
                  <Text style={styles.positionText}>{getPositionLabel(card.position)}</Text>
                </View>
              )}
              <View style={styles.infoPill} accessible accessibilityLabel={t('common.ratingA11y', { rating: card.rating })}>
                <Text style={styles.ratingText}>{card.rating}</Text>
              </View>
            </Animated.View>
            <Text style={styles.name} accessibilityRole="header" numberOfLines={1} adjustsFontSizeToFit>
              {card.name}
            </Text>
            {/* Clube quando a base informa; senão, a seleção. */}
            <Text style={styles.team} numberOfLines={1}>
              {card.team || nation}
            </Text>
          </View>

          <View style={styles.artwork}>
            <CardArtwork uri={card.imageUri} style={StyleSheet.absoluteFill} pointerEvents="none" />
          </View>
        </Animated.View>

        {/* Raridade global do jogador: abre as cópias já encontradas. */}
        <Animated.View style={discoveryStyle}>
          <GlobalDiscoveryButton
            found={card.copiesFound}
            total={card.totalCopies}
            onPress={() => router.push({ pathname: '/found-copies/[id]', params: { id: String(card.id) } })}
          />
        </Animated.View>
      </CardHero>

      <View style={styles.scrollArea}>
        <ScrollView
          contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.statsSection, statsStyle]}>
            <Text style={styles.sectionTitle}>{t('cardDetails.statistics')}</Text>
            {STAT_CONFIG.map((stat) => (
              <StatRow
                key={stat.key}
                label={t(`stats.${stat.key}`)}
                value={card.stats[stat.key]}
                color={stat.color}
                icon={stat.renderIcon(STAT_ICON_SIZE)}
                fillDelay={ENTRANCE.statBarsDelay}
              />
            ))}
          </Animated.View>

          <Text style={[styles.sectionTitle, styles.sectionSpacing]}>{t('cardDetails.cardInfo')}</Text>
          <View style={styles.infoCard}>
            {/* Serial e data de coleta só existem quando o usuário tem uma cópia deste jogador. */}
            {owned && <InfoRow label={t('cardDetails.serial')} value={`#${owned.serial} / ${owned.maxSerial}`} />}
            <InfoRow label={t('cardDetails.position')} value={getPositionName(card.position)} last={!owned} />
            {owned && <InfoRow label={t('cardDetails.collected')} value={formatShortDate(owned.collectedAt)} last />}
          </View>

          <Text style={[styles.sectionTitle, styles.sectionSpacing]}>{t('cardDetails.similarCards')}</Text>
          {/* Sangra até as bordas da tela: a última carta aparece cortada, indicando rolagem. */}
          <FlatList
            horizontal
            data={similar.data ?? []}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => <SimilarCardTile player={item} onPress={() => openSimilar(item.id)} />}
            showsHorizontalScrollIndicator={false}
            style={styles.similarList}
            contentContainerStyle={styles.similarContent}
          />

          {/* Ações demonstrativas: as telas de troca e de mercado ainda não existem. */}
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.actionButton, styles.tradeButton, pressed && styles.actionPressed]}>
              <Text style={styles.tradeText}>{t('cardDetails.tradeCard')}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.actionButton, styles.marketButton, pressed && styles.actionPressed]}>
              <Text style={styles.marketText}>{t('cardDetails.viewOnMarket')}</Text>
            </Pressable>
          </View>
        </ScrollView>

        {/* O conteúdo vai sumindo ao subir por baixo do header. */}
        <EdgeFade edge="top" height={SCROLL_FADE_HEIGHT} />
      </View>

      {/* Ações fixas no topo, por cima da arte. */}
      <View style={[styles.topBar, { top: insets.top + 8 }]} pointerEvents="box-none">
        <IconButton
          icon={<ArrowLeftIcon color={colors.foreground} />}
          accessibilityLabel={t('common.goBack')}
          onPress={goBack}
        />
        <View style={styles.topActions}>
          <IconButton
            icon={<HeartIcon color={favorite ? colors.danger : colors.foreground} filled={favorite} />}
            accessibilityLabel={favorite ? t('cardDetails.removeFavorite') : t('cardDetails.addFavorite')}
            selected={favorite}
            onPress={() => setFavorite((value) => !value)}
          />
          <IconButton
            icon={<ShareIcon color={colors.foreground} />}
            accessibilityLabel={t('cardDetails.share')}
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
    width: HERO_ARTWORK_WIDTH,
    height: HERO_ARTWORK_HEIGHT,
    overflow: 'hidden',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statsSection: {
    gap: 12,
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
  similarList: {
    marginHorizontal: -20,
  },
  similarContent: {
    gap: 14,
    paddingHorizontal: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 18,
  },
  actionPressed: {
    transform: [{ scale: 0.97 }],
  },
  tradeButton: {
    backgroundColor: colors.primary,
  },
  tradeText: {
    color: colors.primaryForeground,
    fontSize: 16,
    fontWeight: '800',
  },
  marketButton: {
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  marketText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
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

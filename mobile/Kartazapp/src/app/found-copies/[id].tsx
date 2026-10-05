import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { STAT_CONFIG } from '@/components/card-details/stat-config';
import { FoundCopyCard } from '@/components/found-copies/found-copy-card';
import { ArrowLeftIcon } from '@/components/icons/arrow-left-icon';
import { getFoundCopies } from '@/mocks/found-copies';
import { getPlayerById } from '@/mocks/players';
import { colors } from '@/theme/colors';

const H_PADDING = 20;
const GAP = 16;
const STAT_ICON_SIZE = 15;

/** Mesmo padrão de entrada em cascata das outras listas. */
const CARD_STAGGER_MS = 60;
const CARD_MAX_DELAY_MS = 480;

function cardEntering(index: number) {
  return FadeInDown.delay(Math.min(index * CARD_STAGGER_MS, CARD_MAX_DELAY_MS)).duration(350);
}

/** Cópias de um jogador já encontradas no jogo, com quem as possui. */
export default function FoundCopiesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const player = id ? getPlayerById(id) : undefined;
  const copies = useMemo(() => (player ? getFoundCopies(player) : []), [player]);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/collection'));

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.goBack')}
          onPress={goBack}
          hitSlop={12}
          style={styles.back}>
          <ArrowLeftIcon color={colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle} accessibilityRole="header">
          {t('foundCopies.title')}
        </Text>
      </View>

      {player ? (
        <Animated.FlatList
          data={copies}
          keyExtractor={(copy) => String(copy.serial)}
          ListHeaderComponent={
            <View style={styles.summary}>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={1}>
                  {player.name}
                </Text>
                <View style={styles.ratingPill} accessible accessibilityLabel={t('common.ratingA11y', { rating: player.rating })}>
                  <Text style={styles.rating}>{player.rating}</Text>
                </View>
              </View>
              <View style={styles.stats}>
                {STAT_CONFIG.map((stat) => (
                  <View
                    key={stat.key}
                    style={styles.stat}
                    accessible
                    accessibilityLabel={`${t(`stats.${stat.key}`)} ${player.stats[stat.key]}`}>
                    {stat.renderIcon(STAT_ICON_SIZE)}
                    <Text style={styles.statValue}>{player.stats[stat.key]}</Text>
                  </View>
                ))}
              </View>
            </View>
          }
          ListEmptyComponent={<Text style={styles.empty}>{t('foundCopies.empty')}</Text>}
          renderItem={({ item, index }) => (
            <Animated.View entering={cardEntering(index)} style={styles.item}>
              <FoundCopyCard copy={item} />
            </Animated.View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
          contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <Text style={styles.empty}>{t('foundCopies.notFound')}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: H_PADDING,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  back: {
    position: 'absolute',
    left: H_PADDING,
    bottom: 16,
  },
  headerTitle: {
    color: colors.foreground,
    fontSize: 18,
    fontWeight: '800',
  },
  summary: {
    gap: 16,
    paddingHorizontal: H_PADDING,
    paddingVertical: 20,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  name: {
    flexShrink: 1,
    color: colors.foreground,
    fontSize: 24,
    fontWeight: '800',
  },
  ratingPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  rating: {
    color: colors.foreground,
    fontSize: 20,
    fontWeight: '800',
  },
  // Os 6 atributos numa linha só, distribuídos pela largura.
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    color: colors.foreground,
    fontSize: 15,
    fontWeight: '800',
  },
  item: {
    paddingHorizontal: H_PADDING,
  },
  empty: {
    marginTop: 24,
    textAlign: 'center',
    color: colors.mutedForeground,
    fontSize: 14,
  },
});

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeInDown, FadeOutDown, ZoomIn, ZoomOut } from 'react-native-reanimated';

import { BoltIcon } from '@/components/icons/bolt-icon';
import { FlameIcon } from '@/components/icons/flame-icon';
import { MapPinIcon } from '@/components/icons/map-pin-icon';
import { TargetIcon } from '@/components/icons/target-icon';
import { TrendingUpIcon } from '@/components/icons/trending-up-icon';
import { colors, withAlpha } from '@/theme/colors';

import { RadarButton } from './radar-button';
import { RadarFab } from './radar-fab';
import { ZoneStat } from './zone-stat';

export type ZoneDifficulty = 'low' | 'medium' | 'high';

const DIFFICULTY_COLOR: Record<ZoneDifficulty, string> = {
  low: colors.primary,
  medium: colors.gold,
  high: colors.accent,
};

const STAT_ICON_SIZE = 14;

type MapDashboardProps = {
  zone: string;
  difficulty: ZoneDifficulty;
  /** Cartas já descobertas na zona / total de cartas da zona. */
  discovered: number;
  totalCards: number;
  /** Calor (atividade) da zona em %. */
  heat: number;
  /** XP de recompensa da zona. */
  xpReward: number;
  /** Multiplicador de recompensa ativo. */
  multiplier: number;
  searching: boolean;
  canSearch: boolean;
  onRadarSearch: () => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * Painel da zona atual do mapa (fica acima da tab bar).
 * Recolhido: só um botão de radar. Expandido: zona, dificuldade, indicadores e botão de busca.
 * Só exibe dados e emite intenções — quem decide a busca é o servidor.
 */
export function MapDashboard({
  zone,
  difficulty,
  discovered,
  totalCards,
  heat,
  xpReward,
  multiplier,
  searching,
  canSearch,
  onRadarSearch,
  style,
}: MapDashboardProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={[styles.container, style]} pointerEvents="box-none">
      {expanded ? (
        <Animated.View
          key="panel"
          entering={FadeInDown.duration(220)}
          exiting={FadeOutDown.duration(160)}
          style={styles.panel}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('mapDashboard.collapse')}
            onPress={() => setExpanded(false)}
            hitSlop={8}
            style={styles.grabberArea}>
            <View style={styles.grabber} />
          </Pressable>

          <View style={styles.content}>
            <View style={styles.info}>
              <View style={styles.titleRow}>
                <MapPinIcon color={colors.primary} size={18} />
                <Text style={styles.zone} numberOfLines={1}>
                  {zone}
                </Text>
              </View>

              <View style={styles.stats}>
                <ZoneStat
                  icon={<TargetIcon color={colors.violet} size={STAT_ICON_SIZE} />}
                  value={`${discovered}/${totalCards}`}
                  accessibilityLabel={t('mapDashboard.discoveredA11y', { discovered, total: totalCards })}
                />
                <ZoneStat
                  icon={<FlameIcon color={colors.accent} size={STAT_ICON_SIZE} />}
                  value={`${heat}%`}
                  accessibilityLabel={t('mapDashboard.heatA11y', { heat })}
                />
                <ZoneStat
                  icon={<BoltIcon color={colors.gold} size={STAT_ICON_SIZE} />}
                  value={`+${xpReward}`}
                  accessibilityLabel={t('mapDashboard.xpRewardA11y', { xp: xpReward })}
                />
                <ZoneStat
                  icon={<TrendingUpIcon color={colors.primary} size={STAT_ICON_SIZE} />}
                  value={`x${multiplier}`}
                  accessibilityLabel={t('mapDashboard.multiplierA11y', { multiplier })}
                />
              </View>
            </View>

            <Text style={[styles.difficulty, { color: DIFFICULTY_COLOR[difficulty] }]}>
              {t(`mapDashboard.difficulty.${difficulty}`)}
            </Text>

            <RadarButton searching={searching} disabled={!canSearch} onPress={onRadarSearch} />
          </View>
        </Animated.View>
      ) : (
        <Animated.View key="fab" entering={ZoomIn.duration(200)} exiting={ZoomOut.duration(150)}>
          <RadarFab onPress={() => setExpanded(true)} />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
  },
  panel: {
    alignSelf: 'stretch',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderRadius: 22,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: withAlpha(colors.primary, 0.25),
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  grabberArea: {
    alignSelf: 'center',
    paddingTop: 8,
    paddingBottom: 6,
    paddingHorizontal: 24,
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: withAlpha(colors.white, 0.25),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  info: {
    flex: 1,
    gap: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  zone: {
    flexShrink: 1,
    color: colors.foreground,
    fontSize: 17,
    fontWeight: '800',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: 14,
    rowGap: 6,
  },
  difficulty: {
    alignSelf: 'flex-start',
    marginTop: 2,
    fontSize: 13,
    fontWeight: '800',
  },
});

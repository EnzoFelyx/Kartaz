import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeInDown, FadeOutDown, ZoomIn, ZoomOut } from 'react-native-reanimated';

import { CardsIcon } from '@/components/icons/cards-icon';
import { CompassIcon } from '@/components/icons/compass-icon';
import { FlagIcon } from '@/components/icons/flag-icon';
import { MapPinIcon } from '@/components/icons/map-pin-icon';
import { UsersIcon } from '@/components/icons/users-icon';
import { WalkingIcon } from '@/components/icons/walking-icon';
import { ProgressBar } from '@/components/ui/progress-bar';
import { colors, withAlpha } from '@/theme/colors';
import { formatDecimal } from '@/utils/card-labels';

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
const EMPTY = '—';

type MapDashboardProps = {
  /** "Cidade - UF"; `null` enquanto não houver (fora do Explore ou geocoder sem resposta). */
  location: string | null;
  difficulty: ZoneDifficulty;
  /** Jogadores por perto (sala + anel ~1 km); `null` com Explore OFF. */
  nearbyCount: number | null;
  /** Cartas no mapa da sala (área res 8), visíveis ou não; `null` com Explore OFF. */
  cardsCount: number | null;
  /** Distância total andada (km). */
  distanceKm: number;
  /**
   * Dono da bandeira da área: nome de quem a coletou, `null` = sem dono (bandeira esperando),
   * `undefined` = desconhecido (Explore OFF ou a sala ainda não respondeu).
   */
  flagOwnerName: string | null | undefined;
  exploreOn: boolean;
  /** Progresso da barra (0 a 1). */
  xpProgress: number;
  searching: boolean;
  canSearch: boolean;
  /** Segundos de espera do radar (`null` = pronto). */
  radarCooldownSeconds?: number | null;
  onRadarSearch: () => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * Painel da zona atual do mapa (fica acima da tab bar).
 * Recolhido: só o botão do radar. Expandido: localização, dificuldade, Perto / km,
 * dono da bandeira da área, Explore On/Off, barra de XP e botão de busca.
 * Só exibe dados e emite intenções — quem decide é o servidor.
 */
export function MapDashboard({
  location,
  difficulty,
  nearbyCount,
  cardsCount,
  distanceKm,
  flagOwnerName,
  exploreOn,
  xpProgress,
  searching,
  canSearch,
  radarCooldownSeconds,
  onRadarSearch,
  style,
}: MapDashboardProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const nearby = nearbyCount === null ? EMPTY : String(nearbyCount);
  const cardsInRoom = cardsCount === null ? EMPTY : String(cardsCount);
  const km = formatDecimal(distanceKm);
  const flagOwner = flagOwnerName === undefined ? EMPTY : (flagOwnerName ?? t('mapDashboard.flagNoOwner'));

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
                  {location ?? EMPTY}
                </Text>
                <Text style={[styles.difficulty, { color: DIFFICULTY_COLOR[difficulty] }]}>
                  {t(`mapDashboard.difficulty.${difficulty}`)}
                </Text>
              </View>

              <View style={styles.stats}>
                <ZoneStat
                  icon={<UsersIcon color={colors.primary} size={STAT_ICON_SIZE} />}
                  value={`${t('mapDashboard.nearme')}: ${nearby}`}
                  accessibilityLabel={t('mapDashboard.nearmeA11y', { count: nearbyCount ?? 0 })}
                />
                <ZoneStat
                  icon={<CardsIcon color={colors.primarySoft} size={STAT_ICON_SIZE} />}
                  value={cardsInRoom}
                  accessibilityLabel={t('mapDashboard.cardsA11y', { count: cardsCount ?? 0 })}
                />
                <ZoneStat
                  icon={<WalkingIcon color={colors.magenta} size={STAT_ICON_SIZE} />}
                  value={`${km} km`}
                  accessibilityLabel={t('mapDashboard.distanceA11y', { km })}
                />
              </View>

              <View style={styles.stats}>
                <ZoneStat
                  icon={<FlagIcon color={colors.accent} size={STAT_ICON_SIZE} />}
                  value={flagOwner}
                  accessibilityLabel={t('mapDashboard.flagOwnerA11y', { owner: flagOwner })}
                  shrink
                />
                <View
                  style={styles.explorer}
                  accessible
                  accessibilityLabel={t('mapDashboard.explorerA11y', {
                    state: t(exploreOn ? 'mapDashboard.on' : 'mapDashboard.off'),
                  })}>
                  <CompassIcon color={colors.secondaryForeground} size={STAT_ICON_SIZE} />
                  <Text style={styles.explorerLabel}>{t('mapDashboard.explorer')}:</Text>
                  <View style={[styles.badge, exploreOn ? styles.badgeOn : styles.badgeOff]}>
                    <Text style={[styles.badgeText, exploreOn && styles.badgeTextOn]}>
                      {t(exploreOn ? 'mapDashboard.on' : 'mapDashboard.off')}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <RadarButton
              searching={searching}
              disabled={!canSearch}
              cooldownSeconds={radarCooldownSeconds}
              onPress={onRadarSearch}
            />
          </View>

          <View style={styles.progress} accessible accessibilityLabel={t('mapDashboard.xpProgressA11y')}>
            <ProgressBar progress={xpProgress} height={6} colors={[colors.violet, colors.info]} />
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
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  zone: {
    flex: 1,
    color: colors.foreground,
    fontSize: 17,
    fontWeight: '800',
  },
  difficulty: {
    fontSize: 13,
    fontWeight: '800',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: 14,
    rowGap: 6,
  },
  explorer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  explorerLabel: {
    color: colors.foreground,
    fontSize: 13,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeOn: {
    backgroundColor: withAlpha(colors.success, 0.2),
  },
  badgeOff: {
    backgroundColor: withAlpha(colors.white, 0.12),
  },
  badgeText: {
    color: colors.secondaryForeground,
    fontSize: 12,
    fontWeight: '700',
  },
  badgeTextOn: {
    color: colors.success,
  },
  progress: {
    marginTop: 12,
  },
});

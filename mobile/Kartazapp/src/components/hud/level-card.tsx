import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { BoltIcon } from '@/components/icons/bolt-icon';
import { GradientBox } from '@/components/ui/gradient-box';
import { colors } from '@/theme/colors';
import { formatNumber } from '@/utils/card-labels';

const BADGE_SIZE = 44;
const BADGE_RADIUS = 12;

type LevelCardProps = {
  level: number;
  xp: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Card de Level/XP do HUD do mapa: badge com o nível (gradiente magenta → roxo em Skia)
 * e o XP total ao lado. Os valores vêm de fora (store/servidor).
 */
export function LevelCard({ level, xp, style }: LevelCardProps) {
  const { t } = useTranslation();
  return (
    <View
      style={[styles.panel, style]}
      accessible
      accessibilityLabel={t('hud.levelA11y', { level, xp: formatNumber(xp) })}>
      {/* A sombra fica por fora: o GradientBox recorta o conteúdo (overflow). */}
      <View style={styles.badge}>
        <GradientBox
          width={BADGE_SIZE}
          height={BADGE_SIZE}
          radius={BADGE_RADIUS}
          colors={[colors.magenta, colors.violet]}>
          <Text style={styles.level}>{level}</Text>
        </GradientBox>
      </View>

      <View style={styles.info}>
        <View style={styles.xpLabel}>
          <BoltIcon color={colors.violet} size={14} />
          <Text style={styles.xpText}>{t('hud.xp')}</Text>
        </View>
        <Text style={styles.xpValue}>{formatNumber(xp)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    shadowColor: colors.magenta,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  level: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  info: {
    gap: 2,
  },
  xpLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  xpText: {
    color: colors.violet,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  xpValue: {
    color: colors.foreground,
    fontSize: 15,
    fontWeight: '800',
  },
});

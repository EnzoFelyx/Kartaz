import { Canvas, LinearGradient, RoundedRect, vec } from '@shopify/react-native-skia';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { BoltIcon } from '@/components/icons/bolt-icon';
import { colors } from '@/theme/colors';

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
  return (
    <View
      style={[styles.panel, style]}
      accessible
      accessibilityLabel={`Level ${level}, ${xp} XP`}>
      <View style={styles.badge}>
        <Canvas style={StyleSheet.absoluteFill}>
          <RoundedRect x={0} y={0} width={BADGE_SIZE} height={BADGE_SIZE} r={BADGE_RADIUS}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(BADGE_SIZE, BADGE_SIZE)}
              colors={[colors.magenta, colors.violet]}
            />
          </RoundedRect>
        </Canvas>
        <Text style={styles.level}>{level}</Text>
      </View>

      <View style={styles.info}>
        <View style={styles.xpLabel}>
          <BoltIcon color={colors.violet} size={14} />
          <Text style={styles.xpText}>XP</Text>
        </View>
        <Text style={styles.xpValue}>{xp.toLocaleString('en-US')}</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
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

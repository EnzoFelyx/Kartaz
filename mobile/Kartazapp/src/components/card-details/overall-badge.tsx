import { Canvas, LinearGradient, RoundedRect, vec } from '@shopify/react-native-skia';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { colors, withAlpha } from '@/theme/colors';

const WIDTH = 84;
const HEIGHT = 108;
const RADIUS = 18;

type OverallBadgeProps = {
  rating: number;
};

/** Selo de overall dos detalhes da carta: "OVR" + nota, com gradiente azul (Skia). */
export function OverallBadge({ rating }: OverallBadgeProps) {
  const { t } = useTranslation();

  return (
    // Camada de fora só para o glow: com `overflow: hidden` a sombra seria cortada.
    <View style={styles.glow} accessible accessibilityLabel={t('common.ratingA11y', { rating })}>
      <View style={styles.badge}>
        <Canvas style={StyleSheet.absoluteFill}>
          {/* Gradiente do canto superior esquerdo ao inferior direito. */}
          <RoundedRect x={0} y={0} width={WIDTH} height={HEIGHT} r={RADIUS}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(WIDTH, HEIGHT)}
              colors={[colors.overallTop, colors.overallBottom]}
            />
          </RoundedRect>
        </Canvas>
        <Text style={styles.label}>{t('common.overallShort')}</Text>
        <Text style={styles.rating}>{rating}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  glow: {
    borderRadius: RADIUS,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  badge: {
    width: WIDTH,
    height: HEIGHT,
    borderRadius: RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: withAlpha(colors.primary, 0.75),
  },
  label: {
    color: colors.primarySoft,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  rating: {
    color: colors.foreground,
    fontSize: 40,
    fontWeight: '800',
    lineHeight: 44,
  },
});

import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, withAlpha } from '@/theme/colors';

type OvrBadgeProps = {
  /** Overall do jogador (0 ou nulo mostra "—"). */
  ovr: number | null | undefined;
  /**
   * `circle`: círculo com borda azul sobre a foto (grade, carta revelada).
   * `outline`: pílula contornada (cartas das trocas). `solid`: pílula azul cheia (carta pedida na troca).
   */
  variant?: 'circle' | 'outline' | 'solid';
  style?: StyleProp<ViewStyle>;
};

/** Selo do overall do jogador. */
export function OvrBadge({ ovr, variant = 'circle', style }: OvrBadgeProps) {
  const value = ovr && ovr > 0 ? String(ovr) : '—';
  return (
    <View style={[styles[variant], style]}>
      <Text style={[styles.text, variant === 'circle' ? styles.textCircle : variant === 'solid' && styles.textSolid]}>
        {value}
      </Text>
    </View>
  );
}

const CIRCLE_SIZE = 40;

const styles = StyleSheet.create({
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.glass,
  },
  outline: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: withAlpha(colors.primary, 0.15),
    borderWidth: 1,
    borderColor: withAlpha(colors.primary, 0.5),
  },
  solid: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  text: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  textCircle: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: '800',
  },
  textSolid: {
    color: colors.primaryForeground,
    fontSize: 15,
  },
});

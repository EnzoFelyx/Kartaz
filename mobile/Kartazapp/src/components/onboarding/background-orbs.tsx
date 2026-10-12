import { StyleSheet, View } from 'react-native';

import { colors, withAlpha } from '@/theme/colors';

const ORB_SIZE = 280;

/** Círculos decorativos e discretos no fundo do onboarding. */
export function BackgroundOrbs() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[styles.orb, styles.right]} />
      <View style={[styles.orb, styles.left]} />
    </View>
  );
}

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    backgroundColor: withAlpha(colors.info, 0.06),
  },
  right: {
    top: '24%',
    right: -ORB_SIZE / 2,
  },
  left: {
    top: '50%',
    left: -ORB_SIZE / 2,
  },
});

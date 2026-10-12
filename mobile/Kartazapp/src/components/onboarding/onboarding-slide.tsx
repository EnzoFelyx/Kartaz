import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { colors } from '@/theme/colors';
import { listItemEntering } from '@/utils/list-loading';

type OnboardingSlideProps = {
  width: number;
  illustration: ReactNode;
  title: string;
  description: string;
  /** Conteúdo extra abaixo do texto (botões de entrada no último slide). */
  children?: ReactNode;
};

/** Uma página do onboarding: ilustração, título e descrição, com entrada em cascata. */
export function OnboardingSlide({ width, illustration, title, description, children }: OnboardingSlideProps) {
  return (
    <View style={[styles.slide, { width }]}>
      <Animated.View entering={listItemEntering(0)} style={styles.illustration}>
        {illustration}
      </Animated.View>
      <View style={styles.texts}>
        <Animated.Text entering={listItemEntering(1)} style={styles.title} accessibilityRole="header">
          {title}
        </Animated.Text>
        <Animated.View entering={listItemEntering(2)}>
          <Text style={styles.description}>{description}</Text>
        </Animated.View>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 40,
  },
  illustration: {
    alignItems: 'center',
  },
  texts: {
    gap: 14,
  },
  title: {
    color: colors.foreground,
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
  },
  description: {
    color: colors.secondaryForeground,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
});

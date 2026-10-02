import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ActiveIndicatorRadar } from './active-indicator-radar';
import { ActivityIndicatorDot } from './activity-indicator-dot';

type TabBarItemProps = {
  icon: ReactNode;
  focused: boolean;
  accessibilityLabel?: string;
  onPress: () => void;
  onLongPress: () => void;
};

export function TabBarItem({
  icon,
  focused,
  accessibilityLabel,
  onPress,
  onLongPress,
}: TabBarItemProps) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      onLongPress={onLongPress}
      hitSlop={4}
      style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
      <View style={styles.iconWrapper}>
        {focused && <ActiveIndicatorRadar />}
        {icon}
        <View style={styles.dot}>
          <ActivityIndicatorDot active={focused} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Canto superior direito: o centro do dot (≈8.4px) fica sobre a quina do ícone,
  // deslocado um pouco para fora, para encostar sem cobrir o desenho.
  dot: {
    position: 'absolute',
    top: -4,
    right: -5,
    zIndex: 1,
  },
  pressed: {
    opacity: 0.6,
  },
});

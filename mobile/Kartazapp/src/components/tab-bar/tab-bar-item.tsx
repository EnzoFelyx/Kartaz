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
      </View>
      <ActivityIndicatorDot active={focused} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
});

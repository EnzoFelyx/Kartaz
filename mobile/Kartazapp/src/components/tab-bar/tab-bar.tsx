import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme/colors';

import { TabBarItem } from './tab-bar-item';
import { TabBarShimmerBorder } from './tab-bar-shimmer-border';

const BAR_HEIGHT = 64;
const ICON_SIZE = 24;

/**
 * Tab bar flutuante em pílula. No iOS 26+ usa Liquid Glass (GlassView);
 * nas outras plataformas/versões cai para um fundo translúcido do tema.
 */
export function TabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const [width, setWidth] = useState(0);

  const items = state.routes.map((route, index) => {
    const { options } = descriptors[route.key];
    const focused = state.index === index;
    const color = focused ? colors.primary : colors.subtle;

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!focused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    };

    const onLongPress = () => {
      navigation.emit({ type: 'tabLongPress', target: route.key });
    };

    return (
      <TabBarItem
        key={route.key}
        icon={options.tabBarIcon?.({ focused, color, size: ICON_SIZE })}
        focused={focused}
        accessibilityLabel={options.tabBarAccessibilityLabel ?? options.title ?? route.name}
        onPress={onPress}
        onLongPress={onLongPress}
      />
    );
  });

  return (
    <View
      style={[styles.wrapper, { bottom: insets.bottom + 8 }]}
      pointerEvents="box-none"
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {isLiquidGlassAvailable() ? (
        <GlassView glassEffectStyle="regular" colorScheme="dark" style={styles.bar}>
          {items}
        </GlassView>
      ) : (
        <View style={[styles.bar, styles.fallback]}>{items}</View>
      )}
      <TabBarShimmerBorder width={width} height={BAR_HEIGHT} radius={BAR_HEIGHT / 2} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 24,
    right: 24,
  },
  bar: {
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    overflow: 'hidden',
  },
  fallback: {
    backgroundColor: colors.tabBarFallback,
  },
});

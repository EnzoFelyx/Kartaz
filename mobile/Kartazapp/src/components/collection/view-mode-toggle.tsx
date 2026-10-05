import { useEffect, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { GlobeIcon } from '@/components/icons/globe-icon';
import { GridIcon } from '@/components/icons/grid-icon';
import { ListIcon } from '@/components/icons/list-icon';
import { colors } from '@/theme/colors';

export type ViewMode = 'grid' | 'list' | 'nations';

/** Ordem dos botões no toggle (define a posição do fundo deslizante). */
const MODES: ViewMode[] = ['grid', 'list', 'nations'];

const BUTTON_WIDTH = 44;
const BUTTON_HEIGHT = 36;
const GAP = 4;
const PADDING = 4;

type ViewModeToggleProps = {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
};

type ToggleButtonProps = {
  active: boolean;
  label: string;
  onPress: () => void;
  renderIcon: (color: string) => ReactNode;
};

function ToggleButton({ active, label, onPress, renderIcon }: ToggleButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={styles.button}>
      {renderIcon(active ? colors.primaryForeground : colors.mutedForeground)}
    </Pressable>
  );
}

/**
 * Alternância entre visualização em grade, em lista e por seleções (só ícones).
 * O fundo ciano desliza suavemente até o botão selecionado.
 */
export function ViewModeToggle({ value, onChange }: ViewModeToggleProps) {
  const position = useSharedValue(MODES.indexOf(value));

  useEffect(() => {
    position.value = withTiming(MODES.indexOf(value), {
      duration: 260,
      easing: Easing.out(Easing.cubic),
    });
  }, [value, position]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: position.value * (BUTTON_WIDTH + GAP) }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.indicator, indicatorStyle]} />
      <ToggleButton
        label="Grid view"
        active={value === 'grid'}
        onPress={() => onChange('grid')}
        renderIcon={(color) => <GridIcon color={color} size={18} />}
      />
      <ToggleButton
        label="List view"
        active={value === 'list'}
        onPress={() => onChange('list')}
        renderIcon={(color) => <ListIcon color={color} size={18} />}
      />
      <ToggleButton
        label="Nations view"
        active={value === 'nations'}
        onPress={() => onChange('nations')}
        renderIcon={(color) => <GlobeIcon color={color} size={18} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: GAP,
    padding: PADDING,
    borderRadius: 16,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
  },
  indicator: {
    position: 'absolute',
    top: PADDING,
    left: PADDING,
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
    borderRadius: 12,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  button: {
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

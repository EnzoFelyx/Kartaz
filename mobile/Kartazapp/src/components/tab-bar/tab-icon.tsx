import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import type { ColorValue } from 'react-native';

type TabIconProps = {
  /** SF Symbol (iOS). Use `{ default, selected }` para trocar o ícone quando a aba está ativa. */
  ios: SFSymbol | { default: SFSymbol; selected: SFSymbol };
  /** Material Symbol (Android/web). */
  android: AndroidSymbol;
  focused: boolean;
  color: ColorValue;
  size: number;
};

export function TabIcon({ ios, android, focused, color, size }: TabIconProps) {
  const iosName = typeof ios === 'string' ? ios : focused ? ios.selected : ios.default;

  return (
    <SymbolView
      name={{ ios: iosName, android, web: android }}
      tintColor={color}
      size={size}
    />
  );
}

import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { useEntranceStyle, type EntranceOptions } from '@/hooks/use-entrance-style';

type EntranceViewProps = EntranceOptions & {
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

/** Bloco que aparece subindo ao montar (use atrasos diferentes para uma entrada em sequência). */
export function EntranceView({ delay, offset, duration, style, children }: EntranceViewProps) {
  const entranceStyle = useEntranceStyle({ delay, offset, duration });
  return <Animated.View style={[style, entranceStyle]}>{children}</Animated.View>;
}

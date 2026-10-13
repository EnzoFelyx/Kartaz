import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { CoinIcon } from '@/components/icons/coin-icon';
import type { CoinGain } from '@/hooks/use-cell-room';
import { colors } from '@/theme/colors';
import { formatNumber } from '@/utils/card-labels';

const GAIN_RISE = 16;
const GAIN_MS = 900;

type CoinBalanceProps = {
  balance: number;
  /** Última coleta: a cada nova, um "+N" dourado sobe e some por cima da pílula. */
  lastGain: CoinGain | null;
  style?: StyleProp<ViewStyle>;
};

/** Saldo de moedas do HUD do mapa (abaixo do nível), com o "+N" animado a cada coleta. */
export function CoinBalance({ balance, lastGain, style }: CoinBalanceProps) {
  const { t } = useTranslation();
  const progress = useSharedValue(1);

  useEffect(() => {
    if (!lastGain) return;
    progress.value = 0;
    progress.value = withTiming(1, { duration: GAIN_MS, easing: Easing.out(Easing.cubic) });
  }, [lastGain, progress]);

  const gainStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [{ translateY: -GAIN_RISE * progress.value }],
  }));

  return (
    <View style={[styles.pill, style]} accessible accessibilityLabel={t('hud.coinsA11y', { count: balance })}>
      <CoinIcon size={18} />
      <Text style={styles.balance}>{formatNumber(balance)}</Text>
      {lastGain && (
        <Animated.Text style={[styles.gain, gainStyle]} pointerEvents="none" accessibilityElementsHidden>
          +{lastGain.value}
        </Animated.Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
  },
  balance: {
    color: colors.foreground,
    fontSize: 15,
    fontWeight: '800',
  },
  gain: {
    position: 'absolute',
    right: 10,
    top: -14,
    color: colors.gold,
    fontSize: 14,
    fontWeight: '800',
  },
});

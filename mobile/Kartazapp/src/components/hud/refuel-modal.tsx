import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { BoltIcon } from '@/components/icons/bolt-icon';
import { CoinIcon } from '@/components/icons/coin-icon';
import { ModalCard } from '@/components/ui/modal-card';
import type { FuelPurchaseError } from '@/hooks/use-cell-room';
import { colors, withAlpha } from '@/theme/colors';
import { formatNumber } from '@/utils/card-labels';

type RefuelModalProps = {
  visible: boolean;
  onClose: () => void;
  fuel: number;
  maxFuel: number;
  /** Saldo de moedas da carteira. */
  balance: number;
  /** Preço fixo para encher o tanque (economia da sala). */
  price: number;
  /** Sala conectada (Explore ON): a compra só acontece por ela. */
  connected: boolean;
  /** Enche o tanque; rejeita com o motivo. */
  onPurchase: () => Promise<void>;
};

/**
 * "Abastecer": mostra a energia atual e o botão de encher o tanque com moedas, por um preço fixo
 * (o mesmo da sala, não importa quanto falta); quem cobra é o servidor.
 */
export function RefuelModal({
  visible,
  onClose,
  fuel,
  maxFuel,
  balance,
  price,
  connected,
  onPurchase,
}: RefuelModalProps) {
  const { t } = useTranslation();
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState<FuelPurchaseError | null>(null);

  const percent = maxFuel > 0 ? Math.round(Math.min(Math.max(fuel / maxFuel, 0), 1) * 100) : 0;
  const full = maxFuel > 0 && fuel >= maxFuel;
  const notEnoughCoins = !full && balance < price;
  const disabled = buying || full || !connected || notEnoughCoins;

  const close = () => {
    setError(null);
    onClose();
  };

  const purchase = async () => {
    setError(null);
    setBuying(true);
    try {
      await onPurchase();
      close();
    } catch (reason) {
      setError(reason as FuelPurchaseError);
    } finally {
      setBuying(false);
    }
  };

  const buttonLabel = full ? t('refuel.full') : t('refuel.fillTank', { cost: formatNumber(price) });
  const note = notEnoughCoins
    ? t('refuel.notEnoughCoins', { balance: formatNumber(balance) })
    : error
      ? t(`refuel.errors.${error}`)
      : null;

  return (
    <ModalCard visible={visible} onClose={close} showClose>
      <Text style={styles.title} accessibilityRole="header">
        {t('refuel.title')}
      </Text>
      <Text style={styles.subtitle}>{t('refuel.subtitle')}</Text>

      <View style={styles.fuelRow}>
        <BoltIcon color={colors.gold} size={18} />
        <Text style={styles.fuelText}>{t('refuel.currentFuel', { percent })}</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={buttonLabel}
        accessibilityState={{ disabled, busy: buying }}
        disabled={disabled}
        onPress={purchase}
        style={({ pressed }) => [styles.buyButton, disabled && styles.buyDisabled, pressed && styles.pressed]}>
        {buying ? (
          <ActivityIndicator color={colors.foreground} />
        ) : (
          <>
            {!full && <CoinIcon size={22} />}
            <Text style={styles.buyText}>{buttonLabel}</Text>
          </>
        )}
      </Pressable>

      {note && <Text style={[styles.note, error && styles.noteError]}>{note}</Text>}
    </ModalCard>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.foreground,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: -8,
    color: colors.secondaryForeground,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  fuelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  fuelText: {
    color: colors.foreground,
    fontSize: 15,
    fontWeight: '700',
  },
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 56,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: withAlpha(colors.info, 0.25),
    borderWidth: 1,
    borderColor: withAlpha(colors.primary, 0.45),
  },
  buyDisabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.8,
  },
  buyText: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '800',
  },
  note: {
    marginTop: -6,
    color: colors.secondaryForeground,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  noteError: {
    color: colors.danger,
  },
});

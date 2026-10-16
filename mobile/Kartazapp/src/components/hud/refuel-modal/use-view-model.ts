import { useState } from 'react';

import type { FuelPurchaseError } from '@/hooks/use-cell-room';

export type RefuelModalProps = {
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
 * "Abastecer": energia atual em %, se dá para comprar (tanque cheio, sem moedas, sem sala) e a
 * compra em si, com o erro devolvido pelo servidor. Quem cobra é o servidor.
 */
export function useRefuelModalViewModel({
  visible,
  onClose,
  fuel,
  maxFuel,
  balance,
  price,
  connected,
  onPurchase,
}: RefuelModalProps) {
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState<FuelPurchaseError | null>(null);

  const full = maxFuel > 0 && fuel >= maxFuel;
  const notEnoughCoins = !full && balance < price;

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

  return {
    visible,
    close,
    percent: maxFuel > 0 ? Math.round(Math.min(Math.max(fuel / maxFuel, 0), 1) * 100) : 0,
    full,
    notEnoughCoins,
    balance,
    price,
    buying,
    disabled: buying || full || !connected || notEnoughCoins,
    error,
    purchase,
  };
}

export type RefuelModalViewModel = ReturnType<typeof useRefuelModalViewModel>;

import { useCallback, useRef, useState } from 'react';

import {
  cardsSignature,
  flagsSignature,
  idsSignature,
  readBatteries,
  readCards,
  readCoins,
  readFillTankPrice,
  readFlagOwner,
  readSelf,
  readUsers,
  selfSignature,
  usersSignature,
} from '@/lib/colyseus/cell-state';
import type { CellBattery, CellCard, CellCoin, CellSelf, CellUser, DiscoveryFlag } from '@/lib/colyseus/types';

/**
 * O que o app mostra da sala atual (jogadores, moedas, baterias, cartas, bandeira, energia...).
 * Cada parte só atualiza quando muda de verdade (assinaturas), para não re-renderizar o mapa a cada patch.
 */
export function useRoomState() {
  const [otherUsers, setOtherUsers] = useState<CellUser[]>([]);
  /** Último estado do jogador vindo da sala (mantido ao sair, até o `GET /user` atualizar). */
  const [self, setSelf] = useState<CellSelf | null>(null);
  /** Outros jogadores por perto (sala + anel k1), contados pelo servidor; `null` fora de sala. */
  const [nearbyCount, setNearbyCount] = useState<number | null>(null);
  /** Bandeira ainda não coletada da sala atual (área res 8) — nunca das vizinhas. */
  const [discoveryFlags, setDiscoveryFlags] = useState<DiscoveryFlag[]>([]);
  /** Dono da bandeira da sala atual: nome de quem coletou, `null` = sem dono, `undefined` = fora de sala. */
  const [flagOwnerName, setFlagOwnerName] = useState<string | null | undefined>(undefined);
  /** Moedas da sala atual (paradas nas coordenadas até alguém coletar). */
  const [coins, setCoins] = useState<CellCoin[]>([]);
  /** Baterias da sala atual (mesmas regras das moedas; recarregam energia). */
  const [batteries, setBatteries] = useState<CellBattery[]>([]);
  const [cards, setCards] = useState<CellCard[]>([]);
  /** Preço fixo para encher o tanque (`state.economy`), mostrado no "Abastecer". */
  const [fillTankPrice, setFillTankPrice] = useState(50);

  const signatures = useRef({ users: '', self: '', flags: '', coins: '', batteries: '', cards: '' });

  /** Atualiza a lista só se a assinatura mudou. */
  const update = useCallback(
    <T>(key: keyof typeof signatures.current, signature: string, value: T, set: (value: T) => void) => {
      if (signature === signatures.current[key]) return;
      signatures.current[key] = signature;
      set(value);
    },
    [],
  );

  /** Novo patch do estado da sala. */
  const applyState = useCallback(
    (state: unknown, sessionId: string, selfUserId: string) => {
      const users = readUsers(state, selfUserId);
      update('users', usersSignature(users), users, setOtherUsers);
      const nextSelf = readSelf(state, sessionId);
      if (nextSelf) update('self', selfSignature(nextSelf), nextSelf, setSelf);
      const nextCoins = readCoins(state);
      update('coins', idsSignature(nextCoins), nextCoins, setCoins);
      const nextBatteries = readBatteries(state);
      update('batteries', idsSignature(nextBatteries), nextBatteries, setBatteries);
      const nextCards = readCards(state);
      update('cards', cardsSignature(nextCards), nextCards, setCards);
      const price = readFillTankPrice(state);
      if (price !== null) setFillTankPrice(price);
      // Dono da bandeira da área: vem no estado da sala (chega junto com a entrada).
      const owner = readFlagOwner(state);
      if (owner !== undefined) setFlagOwnerName(owner);
    },
    [update],
  );

  /** Bandeira de descoberta da sala atual (enviada ao entrar e após cada coleta). */
  const applyFlags = useCallback(
    (flags: DiscoveryFlag[]) => update('flags', flagsSignature(flags), flags, setDiscoveryFlags),
    [update],
  );

  /**
   * Entrou numa sala: bandeira, moedas, baterias, cartas e jogadores da anterior somem na hora (os da
   * nova chegam no join). O dono da bandeira fica até o estado da nova sala chegar.
   */
  const clearRoomAssets = useCallback(() => {
    update('flags', '', [], setDiscoveryFlags);
    update('coins', '', [], setCoins);
    update('batteries', '', [], setBatteries);
    update('cards', '', [], setCards);
    update('users', '', [], setOtherUsers);
  }, [update]);

  /** Fora de sala: limpa tudo da sala (o `self` fica, até o `GET /user` atualizar). */
  const reset = useCallback(() => {
    clearRoomAssets();
    setNearbyCount(null);
    setFlagOwnerName(undefined);
  }, [clearRoomAssets]);

  return {
    otherUsers,
    self,
    nearbyCount,
    discoveryFlags,
    flagOwnerName,
    coins,
    batteries,
    cards,
    fillTankPrice,
    applyState,
    applyFlags,
    setNearbyCount,
    clearRoomAssets,
    reset,
  };
}

export type RoomState = ReturnType<typeof useRoomState>;

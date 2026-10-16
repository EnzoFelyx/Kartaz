import { useState } from 'react';

import type { CardsPack } from '@/lib/colyseus/types';

import { useCardsPackViewModel, type CardsPackModalProps } from './use-view-model';
import { CardsPackFrame, CardsPackView } from './view';

/**
 * Abertura de um pack de cartas (boas-vindas com 5, diário com 2, carta do mapa com 1): uma carta por
 * vez, o jogador toca para revelar e avança. As cartas já são dele (o servidor criou as cópias), então
 * fechar no meio não perde nada.
 */
export function CardsPackModal({ pack, onClose }: CardsPackModalProps) {
  // Mantém o último pack durante o fade de saída do Modal (senão ele some vazio).
  const [shown, setShown] = useState(pack);
  if (pack && pack !== shown) setShown(pack);

  return (
    <CardsPackFrame visible={pack != null} onClose={onClose}>
      {/* O `key` zera índice e carta revelada a cada pack novo. */}
      {shown && <PackContent key={shown.cards[0].id} pack={shown} onClose={onClose} />}
    </CardsPackFrame>
  );
}

function PackContent(props: { pack: CardsPack; onClose: () => void }) {
  const viewModel = useCardsPackViewModel(props);
  return <CardsPackView {...viewModel} />;
}

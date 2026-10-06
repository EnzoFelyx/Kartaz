import { Image } from 'expo-image';
import { FadeInDown } from 'react-native-reanimated';

/**
 * Quando pedir a próxima página: a `onEndReachedThreshold` é medida em "telas" restantes.
 * Com 3, a página seguinte começa a carregar enquanto ainda faltam ~3 telas de itens,
 * então ao chegar no fim os cards já estão lá.
 */
export const LIST_END_THRESHOLD = 3;

/** Só os primeiros itens entram em cascata; o resto (rolagem/próximas páginas) não anima. */
const STAGGER_ITEMS = 8;
const STAGGER_MS = 60;
const ENTER_MS = 350;

/**
 * Entrada dos itens das listas. Animação de layout por item é cara (cada uma roda no mount),
 * então, como no projeto de referência, só os primeiros itens de uma lista nova sobem em
 * cascata; os que montam depois (rolagem, próximas páginas) aparecem sem animação.
 * Não há animação de saída: na troca grade/lista ou na busca, dezenas de itens sairiam
 * animando ao mesmo tempo que os novos entram, o que causava o engasgo.
 */
export function listItemEntering(position: number) {
  return position < STAGGER_ITEMS ? FadeInDown.delay(position * STAGGER_MS).duration(ENTER_MS) : undefined;
}

/**
 * Janela de renderização das listas: menos itens montados por vez na troca de visualização
 * e na rolagem (o padrão do FlatList monta 10 linhas de uma vez e mantém 21 telas em memória).
 */
export const LIST_RENDER_PROPS = {
  // Conta linhas: no grid são 2 cards por linha, então 4 linhas já cobrem a tela abaixo do cabeçalho.
  initialNumToRender: 4,
  maxToRenderPerBatch: 6,
  windowSize: 9,
} as const;

/** Baixa as fotos de uma página para o cache antes dos cards aparecerem na tela. */
export function prefetchPhotos(uris: (string | undefined)[]) {
  const urls = uris.filter((uri): uri is string => !!uri);
  if (urls.length > 0) Image.prefetch(urls, 'memory-disk').catch(() => {});
}

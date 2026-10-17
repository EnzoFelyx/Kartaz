import { Image } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { colors } from '@/theme/colors';

import { PlayerPhoto, type PhotoDepth } from './player-photo';

const CARD_BACKGROUND = require('../../../assets/images/bg-card.png');

type CardArtworkProps = {
  /** Foto do jogador. Sem foto (ou se falhar), fica o fundo padrão da carta. */
  uri?: string;
  style?: StyleProp<ViewStyle>;
  /** Use "none" dentro de um Pressable para o toque passar ao pai. */
  pointerEvents?: ViewProps['pointerEvents'];
  /** Sombra da foto (padrão `card`). */
  depth?: PhotoDepth;
  /** Enquadramento só da foto (o fundo da carta continua cobrindo tudo). */
  photoStyle?: StyleProp<ViewStyle>;
};

/**
 * Arte da carta (portada do projeto de referência): fundo padrão da carta (`bg-card.png`)
 * cobrindo tudo e a foto do jogador por cima. A foto tem fundo transparente, então
 * se mistura com o fundo. Enquanto carrega, aparece o brilho de loading.
 * O arredondamento fica por conta de quem usa (via `style` ou `overflow: hidden` do pai).
 *
 * Sem animação própria de entrada: a cascata da lista e a transição da foto já cuidam disso,
 * e uma animação a mais por card pesava na troca de visualização.
 */
export function CardArtwork({ uri, style, pointerEvents = 'auto', depth, photoStyle }: CardArtworkProps) {
  return (
    <View pointerEvents={pointerEvents} style={[styles.container, style]}>
      <Image
        source={CARD_BACKGROUND}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={0}
      />
      <PlayerPhoto key={uri} uri={uri} depth={depth} style={photoStyle} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: colors.secondary,
  },
});

import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/theme/colors';

import { CardArtwork } from './card-artwork';

type PlayerThumbProps = {
  /** Foto do jogador (ex.: `playerPhotoUri(card.id, card.url)`); sem ela, o fundo padrão da carta. */
  uri?: string;
  size: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

/** Foto do jogador numa caixa quadrada de cantos arredondados (listas de time, trocas, propostas). */
export function PlayerThumb({ uri, size, radius = 14, style }: PlayerThumbProps) {
  return (
    <View style={[styles.box, { width: size, height: size, borderRadius: radius }, style]}>
      <CardArtwork uri={uri} style={styles.photo} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    overflow: 'hidden',
    backgroundColor: colors.secondary,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
});

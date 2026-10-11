import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { UserIcon } from '@/components/icons/user-icon';
import { colors, withAlpha } from '@/theme/colors';

type MapAvatarProps = {
  /** Foto já resolvida com o host da API; sem ela mostra o ícone padrão. */
  uri?: string;
  /** Diâmetro da foto; o halo em volta é proporcional. */
  size?: number;
  /** Destaque do próprio jogador (borda e halo mais fortes). */
  highlighted?: boolean;
  /** Círculo ciano translúcido em volta da foto (padrão: sim). */
  halo?: boolean;
  /** Avisa quando a foto terminou de carregar (ou falhou) — usado pelos `Marker` do mapa. */
  onReady?: () => void;
};

/** Tamanho da foto dos jogadores no mapa (o próprio e os outros). */
export const MAP_PLAYER_AVATAR_SIZE = 29;

/** Foto de perfil circular (com halo ciano opcional), usada no mapa (jogador e outros jogadores). */
export function MapAvatar({ uri, size = 48, highlighted, halo = true, onReady }: MapAvatarProps) {
  const haloSize = Math.round(size * 1.6);
  // Borda proporcional: fotos pequenas ficam com borda fina.
  const border = highlighted && size >= 32 ? 3 : 2;

  const avatar = (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: border,
          borderColor: highlighted ? colors.primary : withAlpha(colors.primary, 0.7),
        },
      ]}>
      {uri ? (
        <Image source={{ uri }} style={styles.image} contentFit="cover" onLoad={onReady} onError={onReady} />
      ) : (
        <UserIcon color={colors.mutedForeground} size={Math.round(size / 2)} />
      )}
    </View>
  );

  if (!halo) return avatar;

  return (
    <View
      collapsable={false}
      style={[
        styles.halo,
        {
          width: haloSize,
          height: haloSize,
          borderRadius: haloSize / 2,
          backgroundColor: withAlpha(colors.primary, highlighted ? 0.18 : 0.1),
          borderColor: withAlpha(colors.primary, highlighted ? 0.4 : 0.25),
        },
      ]}>
      {avatar}
    </View>
  );
}

const styles = StyleSheet.create({
  halo: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: colors.card,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

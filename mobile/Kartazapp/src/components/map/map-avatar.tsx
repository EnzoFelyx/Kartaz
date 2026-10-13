import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { UserIcon } from '@/components/icons/user-icon';
import { colors, withAlpha } from '@/theme/colors';

type MapAvatarProps = {
  /** Foto já resolvida com o host da API; sem ela mostra a inicial do nome (ou o ícone padrão). */
  uri?: string;
  /** Nome do jogador: sem foto, a inicial aparece sobre o gradiente do Perfil. */
  name?: string;
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
export function MapAvatar({ uri, name, size = 48, highlighted, halo = true, onReady }: MapAvatarProps) {
  const initial = name?.trim().charAt(0).toUpperCase();
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
      ) : initial ? (
        <InitialAvatar initial={initial} size={size} />
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

/**
 * Sem foto: inicial em branco sobre o mesmo gradiente do avatar do Perfil (`UserAvatar`).
 * Em SVG (não Skia): os marcadores do mapa viram imagem, e o canvas Skia podia sair em branco.
 */
function InitialAvatar({ initial, size }: { initial: string; size: number }) {
  return (
    <View style={StyleSheet.absoluteFill}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <LinearGradient id="initial" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.primarySoft} />
            <Stop offset="1" stopColor={colors.info} />
          </LinearGradient>
        </Defs>
        <Circle cx="50%" cy="50%" r="50%" fill="url(#initial)" />
      </Svg>
      <View style={styles.initialWrap}>
        <Text style={[styles.initial, { fontSize: Math.round(size * 0.42) }]} allowFontScaling={false}>
          {initial}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  initialWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: colors.white,
    fontWeight: '800',
  },
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

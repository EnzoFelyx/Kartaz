import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { GradientBox } from '@/components/ui/gradient-box';
import { colors, withAlpha } from '@/theme/colors';

type UserAvatarProps = {
  size: number;
  radius: number;
  /** Foto já resolvida com o host da API; sem ela mostra a inicial do nome sobre o gradiente. */
  uri?: string;
  name: string;
  uploading?: boolean;
  /** Selo no canto inferior direito (nível, câmera…). */
  badge?: ReactNode;
  /** Quanto o selo passa para fora da foto (px). */
  badgeOffset?: number;
};

/** Foto de perfil em quadrado arredondado (Perfil e Editar Perfil). */
export function UserAvatar({ size, radius, uri, name, uploading, badge, badgeOffset = 0 }: UserAvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';

  return (
    <View style={{ width: size, height: size }}>
      <View style={[styles.photo, { width: size, height: size, borderRadius: radius }]}>
        {uri ? (
          <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
        ) : (
          <GradientBox width={size} height={size} radius={radius} colors={[colors.primarySoft, colors.info]}>
            <Text style={[styles.initial, { fontSize: Math.round(size * 0.36) }]}>{initial}</Text>
          </GradientBox>
        )}
        {uploading && (
          <View style={styles.overlay}>
            <ActivityIndicator color={colors.white} />
          </View>
        )}
      </View>

      {badge && <View style={[styles.badge, { right: -badgeOffset, bottom: -badgeOffset }]}>{badge}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  photo: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: colors.card,
  },
  initial: {
    color: colors.white,
    fontWeight: '800',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(colors.background, 0.6),
  },
  badge: {
    position: 'absolute',
  },
});

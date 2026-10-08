import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { CameraIcon } from '@/components/icons/camera-icon';
import { UserIcon } from '@/components/icons/user-icon';
import { colors, withAlpha } from '@/theme/colors';

const SIZE = 112;
const BADGE_SIZE = 34;

type ProfileAvatarProps = {
  /** Foto já resolvida com o host da API; sem ela mostra o ícone padrão. */
  uri?: string;
  uploading?: boolean;
  accessibilityLabel: string;
  onPress: () => void;
};

/** Foto de perfil circular com selo de câmera para trocar a imagem. */
export function ProfileAvatar({ uri, uploading, accessibilityLabel, onPress }: ProfileAvatarProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ busy: uploading, disabled: uploading }}
      disabled={uploading}
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}>
      <View style={styles.circle}>
        {uri ? (
          <Image source={{ uri }} style={styles.image} contentFit="cover" transition={200} />
        ) : (
          <UserIcon color={colors.mutedForeground} size={52} />
        )}
        {uploading && (
          <View style={styles.overlay}>
            <ActivityIndicator color={colors.white} />
          </View>
        )}
      </View>
      <View style={styles.badge}>
        <CameraIcon color={colors.primaryForeground} size={16} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    width: SIZE,
    height: SIZE,
  },
  pressed: {
    opacity: 0.8,
  },
  circle: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: withAlpha(colors.primary, 0.5),
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(colors.background, 0.6),
  },
  badge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.background,
  },
});

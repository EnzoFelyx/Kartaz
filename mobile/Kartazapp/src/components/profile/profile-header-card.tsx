import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { EditIcon } from '@/components/icons/edit-icon';
import { ShareIcon } from '@/components/icons/share-icon';
import { GradientBox } from '@/components/ui/gradient-box';
import { IconButton } from '@/components/ui/icon-button';
import { colors, withAlpha } from '@/theme/colors';

const AVATAR_SIZE = 88;
const AVATAR_RADIUS = 22;
const LEVEL_BADGE_SIZE = 34;
const FRIEND_DOT_SIZE = 24;
const EDIT_BUTTON_SIZE = 28;

type ProfileHeaderCardProps = {
  username: string;
  level: number;
  /** Foto já resolvida com o host da API; sem ela mostra a inicial do nome. */
  avatarUri?: string;
  uploadingAvatar?: boolean;
  /** Quantidade de amigos (prévia com até 3 bolinhas + "+N amigos"). */
  friendsCount: number;
  onPressAvatar: () => void;
  onPressEditName: () => void;
  onPressShare: () => void;
};

/** Card do topo do perfil: avatar com selo de nível, nome, título, amigos e compartilhar. */
export function ProfileHeaderCard({
  username,
  level,
  avatarUri,
  uploadingAvatar,
  friendsCount,
  onPressAvatar,
  onPressEditName,
  onPressShare,
}: ProfileHeaderCardProps) {
  const { t } = useTranslation();
  const initial = username.trim().charAt(0).toUpperCase() || '?';
  const friendDots = Math.min(friendsCount, 3);

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('profile.changePhoto')}
        accessibilityState={{ busy: uploadingAvatar, disabled: uploadingAvatar }}
        disabled={uploadingAvatar}
        onPress={onPressAvatar}
        style={({ pressed }) => [styles.avatarWrap, pressed && styles.pressed]}>
        <View style={styles.avatar}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
          ) : (
            <GradientBox
              width={AVATAR_SIZE}
              height={AVATAR_SIZE}
              radius={AVATAR_RADIUS}
              colors={[colors.primarySoft, colors.info]}>
              <Text style={styles.initial}>{initial}</Text>
            </GradientBox>
          )}
          {uploadingAvatar && (
            <View style={styles.avatarOverlay}>
              <ActivityIndicator color={colors.white} />
            </View>
          )}
        </View>

        <GradientBox
          width={LEVEL_BADGE_SIZE}
          height={LEVEL_BADGE_SIZE}
          radius={LEVEL_BADGE_SIZE / 2}
          colors={[colors.magenta, colors.violet]}
          style={styles.levelBadge}>
          <Text style={styles.levelBadgeText} accessibilityElementsHidden>
            {level}
          </Text>
        </GradientBox>
      </Pressable>

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {username}
          </Text>
          <IconButton
            size={EDIT_BUTTON_SIZE}
            icon={<EditIcon color={colors.secondaryForeground} size={14} />}
            accessibilityLabel={t('profile.editName')}
            onPress={onPressEditName}
          />
        </View>

        <Text style={styles.levelTitle}>{t('profile.levelTitle', { level })}</Text>

        {friendsCount > 0 && (
          <View style={styles.friendsRow}>
            <View style={styles.friendDots}>
              {Array.from({ length: friendDots }, (_, index) => (
                <View key={index} style={[styles.friendDot, index > 0 && styles.friendDotOverlap]} />
              ))}
            </View>
            <Text style={styles.friendsText}>{t('profile.friends', { count: friendsCount })}</Text>
          </View>
        )}
      </View>

      <IconButton
        icon={<ShareIcon color={colors.primary} size={20} />}
        accessibilityLabel={t('profile.share')}
        onPress={onPressShare}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    padding: 22,
    borderRadius: 26,
    backgroundColor: withAlpha(colors.info, 0.08),
    borderWidth: 1,
    borderColor: withAlpha(colors.primary, 0.3),
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
  },
  pressed: {
    opacity: 0.8,
  },
  avatarWrap: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: colors.card,
  },
  initial: {
    color: colors.white,
    fontSize: 32,
    fontWeight: '800',
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(colors.background, 0.6),
  },
  levelBadge: {
    position: 'absolute',
    right: -8,
    bottom: -8,
    borderWidth: 2,
    borderColor: colors.background,
  },
  levelBadgeText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  info: {
    flex: 1,
    gap: 6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    flexShrink: 1,
    color: colors.foreground,
    fontSize: 22,
    fontWeight: '800',
  },
  levelTitle: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  friendsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  friendDots: {
    flexDirection: 'row',
  },
  friendDot: {
    width: FRIEND_DOT_SIZE,
    height: FRIEND_DOT_SIZE,
    borderRadius: FRIEND_DOT_SIZE / 2,
    backgroundColor: colors.magenta,
    borderWidth: 2,
    borderColor: colors.background,
  },
  friendDotOverlap: {
    marginLeft: -8,
  },
  friendsText: {
    color: colors.secondaryForeground,
    fontSize: 13,
  },
});

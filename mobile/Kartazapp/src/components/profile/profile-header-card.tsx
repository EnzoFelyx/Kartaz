import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { EditIcon } from '@/components/icons/edit-icon';
import { ShareIcon } from '@/components/icons/share-icon';
import { GradientBox } from '@/components/ui/gradient-box';
import { IconButton } from '@/components/ui/icon-button';

import { UserAvatar } from './user-avatar';
import { colors, withAlpha } from '@/theme/colors';

const AVATAR_SIZE = 88;
const AVATAR_RADIUS = 22;
const LEVEL_BADGE_SIZE = 34;
/** Selo de nível retangular (cantos arredondados), encaixado no canto inferior direito da foto. */
const LEVEL_BADGE_RADIUS = 10;
const LEVEL_BADGE_OFFSET = 3;
const FRIEND_DOT_SIZE = 24;
const EDIT_BUTTON_SIZE = 28;

type ProfileHeaderCardProps = {
  username: string;
  level: number;
  /** Foto já resolvida com o host da API; sem ela mostra a inicial do nome. */
  avatarUri?: string;
  /** Quantidade de amigos (prévia com até 3 bolinhas + "+N amigos"). */
  friendsCount: number;
  /** Abre o Editar Perfil (toque na foto ou no lápis). */
  onPressEdit: () => void;
  onPressShare: () => void;
};

/** Card do topo do perfil: avatar com selo de nível, nome, título, amigos e compartilhar. */
export function ProfileHeaderCard({
  username,
  level,
  avatarUri,
  friendsCount,
  onPressEdit,
  onPressShare,
}: ProfileHeaderCardProps) {
  const { t } = useTranslation();
  const friendDots = Math.min(friendsCount, 3);

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('profile.editProfile')}
        onPress={onPressEdit}
        style={({ pressed }) => pressed && styles.pressed}>
        <UserAvatar
          size={AVATAR_SIZE}
          radius={AVATAR_RADIUS}
          uri={avatarUri}
          name={username}
          badgeOffset={LEVEL_BADGE_OFFSET}
          badge={
            <GradientBox
              width={LEVEL_BADGE_SIZE}
              height={LEVEL_BADGE_SIZE}
              radius={LEVEL_BADGE_RADIUS}
              colors={[colors.magenta, colors.violet]}
              style={styles.levelBadge}>
              <Text style={styles.levelBadgeText} accessibilityElementsHidden>
                {level}
              </Text>
            </GradientBox>
          }
        />
      </Pressable>

      <View style={styles.info}>
        <View style={styles.nameRow}>
          {/* Nomes longos: diminui a fonte até 80% antes de cortar com "…". */}
          <Text style={styles.name} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
            {username}
          </Text>
          <IconButton
            size={EDIT_BUTTON_SIZE}
            icon={<EditIcon color={colors.secondaryForeground} size={14} />}
            accessibilityLabel={t('profile.editProfile')}
            onPress={onPressEdit}
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
    gap: 14,
    paddingVertical: 22,
    paddingHorizontal: 18,
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
  levelBadge: {
    borderWidth: 1,
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
    gap: 6,
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

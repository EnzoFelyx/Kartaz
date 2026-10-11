import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ArrowLeftIcon } from '@/components/icons/arrow-left-icon';
import { CameraIcon } from '@/components/icons/camera-icon';
import { MailIcon } from '@/components/icons/mail-icon';
import { SaveIcon } from '@/components/icons/save-icon';
import { UserAvatar } from '@/components/profile/user-avatar';
import { GradientBox } from '@/components/ui/gradient-box';
import { IconButton } from '@/components/ui/icon-button';
import { TextField } from '@/components/ui/text-field';
import { useCurrentUser, useUploadAvatar } from '@/hooks/queries/use-current-user';
import { useSession } from '@/hooks/queries/use-session';
import { resolveApiUri } from '@/lib/api/image-uri';
import { colors, withAlpha } from '@/theme/colors';
import { listItemEntering } from '@/utils/list-loading';

const H_PADDING = 20;
const AVATAR_SIZE = 120;
const AVATAR_RADIUS = 30;
const CAMERA_BADGE_SIZE = 44;
const CAMERA_BADGE_OFFSET = 10;
const SAVE_BUTTON_SIZE = 48;
const BIO_MAX_LENGTH = 150;

/**
 * Editar Perfil: troca de foto (real, PUT /user/avatar) e campos de nome, email e bio.
 * Nome/email/bio ainda não são salvos no backend — o salvar só volta para o Perfil.
 */
export default function EditProfileScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { data: session } = useSession();
  const { data: user } = useCurrentUser();
  const uploadAvatar = useUploadAvatar();

  const realName = user?.username ?? session?.username ?? '';
  const [username, setUsername] = useState(realName);
  const [email, setEmail] = useState(user?.email ?? '');
  const [bio, setBio] = useState(() => t('editProfile.mockBio', { level: user?.level ?? 1 }));

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/profile'));

  // TODO: salvar nome/email/bio no backend (PATCH /user) quando a edição for implementada.
  const save = goBack;

  // Galeria com recorte quadrado; a foto é reduzida para 512px antes do envio (useUploadAvatar).
  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (result.canceled) return;
    uploadAvatar.mutate(result.assets[0], {
      onError: () => Alert.alert(t('profile.photoErrorTitle'), t('profile.photoErrorMessage')),
    });
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Entrada em cascata (mesma da tela de Cartas): cabeçalho, foto e cada campo. */}
      <Animated.View entering={listItemEntering(0)} style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <IconButton
          icon={<ArrowLeftIcon color={colors.foreground} />}
          accessibilityLabel={t('common.goBack')}
          onPress={goBack}
        />
        <Text style={styles.title} accessibilityRole="header">
          {t('editProfile.title')}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('editProfile.save')}
          onPress={save}
          style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}>
          <GradientBox
            width={SAVE_BUTTON_SIZE}
            height={SAVE_BUTTON_SIZE}
            radius={SAVE_BUTTON_SIZE / 2}
            colors={[colors.primary, colors.info]}>
            <SaveIcon color={colors.white} size={20} />
          </GradientBox>
        </Pressable>
      </Animated.View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        <Animated.View entering={listItemEntering(1)} style={styles.avatarSection}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('editProfile.changeAvatar')}
            accessibilityState={{
              busy: uploadAvatar.isPending,
              disabled: uploadAvatar.isPending,
            }}
            disabled={uploadAvatar.isPending}
            onPress={pickPhoto}
            style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}>
            <UserAvatar
              size={AVATAR_SIZE}
              radius={AVATAR_RADIUS}
              uri={resolveApiUri(user?.avatar)}
              name={realName}
              uploading={uploadAvatar.isPending}
              badgeOffset={CAMERA_BADGE_OFFSET}
              badge={
                <GradientBox
                  width={CAMERA_BADGE_SIZE}
                  height={CAMERA_BADGE_SIZE}
                  radius={CAMERA_BADGE_SIZE / 2}
                  colors={[colors.magenta, colors.violet]}>
                  <CameraIcon color={colors.white} size={20} />
                </GradientBox>
              }
            />
          </Pressable>
          <Text style={styles.avatarHint}>{t('editProfile.changeAvatar')}</Text>
        </Animated.View>

        <View style={styles.form}>
          <Animated.View entering={listItemEntering(2)}>
            <TextField
              label={t('editProfile.username')}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </Animated.View>
          <Animated.View entering={listItemEntering(3)}>
            <TextField
              label={t('editProfile.email')}
              value={email}
              onChangeText={setEmail}
              placeholder={t('editProfile.emailPlaceholder')}
              icon={<MailIcon color={colors.mutedForeground} size={20} />}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </Animated.View>
          <Animated.View entering={listItemEntering(4)}>
            <TextField
              label={t('editProfile.bio')}
              value={bio}
              onChangeText={setBio}
              placeholder={t('editProfile.bioPlaceholder')}
              multiline
              maxLength={BIO_MAX_LENGTH}
            />
          </Animated.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: H_PADDING,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    color: colors.foreground,
    fontSize: 20,
    fontWeight: '800',
  },
  saveButton: {
    borderRadius: SAVE_BUTTON_SIZE / 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
  },
  pressed: {
    opacity: 0.8,
  },
  avatarSection: {
    alignItems: 'center',
    gap: 18,
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    shadowColor: colors.info,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
  },
  avatarHint: {
    color: withAlpha(colors.white, 0.75),
    fontSize: 15,
  },
  form: {
    gap: 22,
    paddingHorizontal: H_PADDING,
    paddingTop: 24,
  },
});

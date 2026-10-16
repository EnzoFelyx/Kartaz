import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CameraIcon } from '@/components/icons/camera-icon';
import { MailIcon } from '@/components/icons/mail-icon';
import { SaveIcon } from '@/components/icons/save-icon';
import { UserAvatar } from '@/components/profile/user-avatar';
import { GradientBox } from '@/components/ui/gradient-box';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TextField } from '@/components/ui/text-field';
import { colors, withAlpha } from '@/theme/colors';
import { listItemEntering } from '@/utils/list-loading';

import type { EditProfileViewModel } from './use-view-model';

const H_PADDING = 20;
const AVATAR_SIZE = 120;
const AVATAR_RADIUS = 30;
const CAMERA_BADGE_SIZE = 44;
const CAMERA_BADGE_OFFSET = 10;
const SAVE_BUTTON_SIZE = 48;
const BIO_MAX_LENGTH = 150;

/** Cabeçalho com salvar, foto com o botão de câmera e os campos de nome, email e bio. */
export function EditProfileView({
  avatarUri,
  realName,
  uploading,
  pickPhoto,
  username,
  setUsername,
  email,
  setEmail,
  bio,
  setBio,
  goBack,
  save,
}: EditProfileViewModel) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Entrada em cascata (mesma da tela de Cartas): cabeçalho, foto e cada campo. */}
      <Animated.View entering={listItemEntering(0)}>
        <ScreenHeader
          title={t('editProfile.title')}
          align="center"
          onBack={goBack}
          right={
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
          }
        />
      </Animated.View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        <Animated.View entering={listItemEntering(1)} style={styles.avatarSection}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('editProfile.changeAvatar')}
            accessibilityState={{ busy: uploading, disabled: uploading }}
            disabled={uploading}
            onPress={pickPhoto}
            style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}>
            <UserAvatar
              size={AVATAR_SIZE}
              radius={AVATAR_RADIUS}
              uri={avatarUri}
              name={realName}
              uploading={uploading}
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

import * as ImagePicker from 'expo-image-picker';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProfileAvatar } from '@/components/profile/profile-avatar';
import { TAB_BAR_BOTTOM_GAP, TAB_BAR_HEIGHT } from '@/components/tab-bar';
import { useCurrentUser, useUploadAvatar } from '@/hooks/queries/use-current-user';
import { useSession, useSignOut } from '@/hooks/queries/use-session';
import { resolveApiUri } from '@/lib/api/image-uri';
import { colors } from '@/theme/colors';

const MASKED = '••••••••';
const EMPTY = '—';

type InfoRowProps = {
  label: string;
  value: string;
};

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1} ellipsizeMode="middle">
        {value}
      </Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.rows}>{children}</View>
    </View>
  );
}

/** Perfil: dados da sessão e do usuário vindos do backend (`GET /user`). */
export default function ProfileScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { data: session } = useSession();
  const user = useCurrentUser();
  const signOut = useSignOut();
  const uploadAvatar = useUploadAvatar();

  // O backend é a fonte da verdade; a sessão salva cobre enquanto ele carrega.
  const profile = user.data;
  const username = profile?.username ?? session?.username ?? EMPTY;
  const avatarId = profile?.avatarId ?? session?.avatarId;
  const isGuest = profile?.is_guest ?? session?.isGuest ?? true;
  const yesNo = (value: boolean) => (value ? t('profile.yes') : t('profile.no'));

  // Galeria com recorte quadrado; o backend guarda a foto para guest e logado igualmente.
  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled) return;
    uploadAvatar.mutate(result.assets[0], {
      onError: (error) => {
        console.log('[Profile] falha ao enviar foto', error.message);
        Alert.alert(t('profile.photoErrorTitle'), t('profile.photoErrorMessage'));
      },
    });
  };

  const confirmSignOut = () => {
    if (!isGuest) {
      signOut.mutate();
      return;
    }
    // Convidado não vinculado: a sessão só existe neste aparelho, sair apaga o acesso de vez.
    Alert.alert(t('auth.guestSignOutTitle'), t('auth.guestSignOutMessage'), [
      { text: t('auth.cancel'), style: 'cancel' },
      { text: t('auth.signOut'), style: 'destructive', onPress: () => signOut.mutate() },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.title} accessibilityRole="header">
          {t('profile.title')}
        </Text>
        <Text style={styles.subtitle}>{t('profile.subtitle')}</Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + TAB_BAR_BOTTOM_GAP + TAB_BAR_HEIGHT + 24 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={user.isRefetching}
            onRefresh={() => user.refetch()}
            tintColor={colors.primary}
          />
        }>
        <ProfileAvatar
          uri={resolveApiUri(profile?.avatar)}
          uploading={uploadAvatar.isPending}
          accessibilityLabel={t('profile.changePhoto')}
          onPress={pickPhoto}
        />

        <Section title={t('profile.session')}>
          <InfoRow label="userId" value={profile?.id ?? session?.userId ?? EMPTY} />
          <InfoRow label="username" value={username} />
          <InfoRow label="access_token" value={session?.accessToken ? MASKED : EMPTY} />
          <InfoRow label="refresh_token" value={session?.refreshToken ? MASKED : EMPTY} />
          <InfoRow label="avatarId" value={avatarId ? String(avatarId) : EMPTY} />
          <InfoRow label="expires_in (s)" value={session?.expiresIn ? String(session.expiresIn) : EMPTY} />
          <InfoRow label="isGuest" value={yesNo(isGuest)} />
        </Section>

        <Section title={t('profile.progress')}>
          <InfoRow label="Fuel" value={profile ? String(Math.round(profile.fuel)) : EMPTY} />
          <InfoRow label="XP" value={profile ? String(profile.xp) : EMPTY} />
          <InfoRow label="Level" value={profile ? String(profile.level) : EMPTY} />
          {user.isError && (
            <Pressable accessibilityRole="button" onPress={() => user.refetch()}>
              <Text style={styles.error}>
                {t('common.loadError')} {t('common.retry')}
              </Text>
            </Pressable>
          )}
        </Section>

        <Section title={t('profile.account')}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('profile.endSession')}
            disabled={signOut.isPending}
            onPress={confirmSignOut}
            style={({ pressed }) => [styles.signOutButton, pressed && styles.pressed]}>
            <Text style={styles.signOutLabel}>{t('profile.endSession')}</Text>
          </Pressable>
          {isGuest && <Text style={styles.hint}>{t('profile.guestHint')}</Text>}
        </Section>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: 4,
  },
  title: {
    color: colors.foreground,
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.mutedForeground,
    fontSize: 13,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 24,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  rows: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: colors.card,
  },
  rowLabel: {
    color: colors.secondaryForeground,
    fontSize: 14,
  },
  rowValue: {
    flexShrink: 1,
    color: colors.foreground,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 4,
  },
  signOutButton: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger,
  },
  pressed: {
    opacity: 0.8,
  },
  signOutLabel: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  hint: {
    color: colors.mutedForeground,
    fontSize: 12,
    textAlign: 'center',
  },
});

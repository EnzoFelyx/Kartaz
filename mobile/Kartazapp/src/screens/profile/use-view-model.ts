import { router, useNavigation, type NativeStackNavigationProp } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { useCurrentUser } from '@/hooks/queries/use-current-user';
import { useCollectionCount } from '@/hooks/queries/use-my-collection';
import { useSession, useSignOut } from '@/hooks/queries/use-session';
import { resolveApiUri } from '@/lib/api/image-uri';

// Ainda sem sistema de conquistas e de amigos: valores fixos até existirem.
const MOCK_PROFILE = { achievements: 1, friendsCount: 3 };

/** Números das estatísticas do perfil (a view escolhe cor e ícone de cada uma). */
export type ProfileStats = {
  totalCards: number;
  achievements: number;
  totalXp: number;
  locations: number;
  flags: number;
};

/**
 * Remonta a tela (muda a `key`) quando ela reaparece, para a entrada em cascata rodar de novo:
 * na volta de uma tela da pilha (já no início da transição, inclusive no gesto) e na troca de aba.
 */
function useReplayKey() {
  const [replayKey, setReplayKey] = useState(0);
  const navigation = useNavigation();
  const leftToStack = useRef(false);

  useEffect(() => {
    const stack = navigation.getParent<NativeStackNavigationProp<Record<string, object | undefined>>>();
    const replay = () => setReplayKey((key) => key + 1);

    // Volta de uma tela da pilha (ex.: Editar Perfil): anima no início da transição, inclusive no
    // gesto de voltar, em vez de esperar o foco (que só chega depois de soltar o dedo).
    const unsubscribeTransition = stack?.addListener('transitionStart', (event) => {
      if (!event.data.closing) replay();
    });
    // Saiu por um push (a pilha perdeu o foco) ou por troca de aba (a pilha continua focada).
    const unsubscribeBlur = navigation.addListener('blur', () => {
      leftToStack.current = !(stack?.isFocused() ?? true);
    });
    // Troca de aba: anima no foco. Vindo da pilha, o transitionStart já animou.
    const unsubscribeFocus = navigation.addListener('focus', () => {
      if (leftToStack.current) {
        leftToStack.current = false;
        return;
      }
      replay();
    });

    return () => {
      unsubscribeTransition?.();
      unsubscribeBlur();
      unsubscribeFocus();
    };
  }, [navigation]);

  return replayKey;
}

/** Perfil: dados do jogador (GET /user), estatísticas, sair da conta e a animação de reentrada. */
export function useProfileViewModel() {
  const { t } = useTranslation();
  const replayKey = useReplayKey();
  const { data: session } = useSession();
  const user = useCurrentUser();
  const collectionCount = useCollectionCount();
  const signOut = useSignOut();

  const profile = user.data;
  const isGuest = profile?.is_guest ?? session?.isGuest ?? true;

  const confirmSignOut = () => {
    // Convidado não vinculado: a sessão só existe neste aparelho, sair apaga o acesso de vez.
    if (isGuest) {
      Alert.alert(t('auth.guestSignOutTitle'), t('auth.guestSignOutMessage'), [
        { text: t('auth.cancel'), style: 'cancel' },
        { text: t('auth.signOut'), style: 'destructive', onPress: () => signOut.mutate() },
      ]);
      return;
    }
    signOut.mutate();
  };

  // Configurações ainda não existem: por enquanto a engrenagem só oferece encerrar a sessão.
  const openSettings = () => {
    Alert.alert(t('profile.settings'), undefined, [
      { text: t('auth.cancel'), style: 'cancel' },
      { text: t('profile.endSession'), style: 'destructive', onPress: confirmSignOut },
    ]);
  };

  const stats: ProfileStats = {
    totalCards: collectionCount.data ?? 0,
    achievements: MOCK_PROFILE.achievements,
    totalXp: profile?.xp ?? 0,
    locations: profile?.coverage ?? 0,
    flags: profile?.discoveryFlags ?? 0,
  };

  return {
    replayKey,
    username: profile?.username ?? session?.username ?? '',
    level: profile?.level ?? 1,
    avatarUri: resolveApiUri(profile?.avatar),
    friendsCount: MOCK_PROFILE.friendsCount,
    isGuest,
    stats,
    refreshing: user.isRefetching,
    refresh: () => {
      void user.refetch();
      void collectionCount.refetch();
    },
    openSettings,
    openEditProfile: () => router.push('/edit-profile'),
  };
}

export type ProfileViewModel = ReturnType<typeof useProfileViewModel>;

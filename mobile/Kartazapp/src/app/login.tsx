import { router } from 'expo-router';
import { useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { AuthButton } from '@/components/auth/auth-button';
import { SocialAuthButtons } from '@/components/auth/social-auth-buttons';
import { ChevronRightIcon } from '@/components/icons/chevron-right-icon';
import { GlobeIcon } from '@/components/icons/globe-icon';
import { MapIcon } from '@/components/icons/map-icon';
import { UsersIcon } from '@/components/icons/users-icon';
import { BackgroundOrbs } from '@/components/onboarding/background-orbs';
import { IllustrationCircle } from '@/components/onboarding/illustration-circle';
import { OnboardingSlide } from '@/components/onboarding/onboarding-slide';
import { PageDots } from '@/components/onboarding/page-dots';
import { TradeIllustration } from '@/components/onboarding/trade-illustration';
import { useMarkOnboardingSeen, useOnboardingSeen } from '@/hooks/queries/use-onboarding';
import { useSession, useSignInAsGuest } from '@/hooks/queries/use-session';
import { colors } from '@/theme/colors';
import { listItemEntering } from '@/utils/list-loading';

type SlideId = 'explore' | 'collect' | 'trade' | 'welcome';

const SLIDES: SlideId[] = ['explore', 'collect', 'trade', 'welcome'];
const LAST_INDEX = SLIDES.length - 1;
const ICON_SIZE = 96;
const WELCOME_CIRCLE_SIZE = 180;
const WELCOME_ICON_SIZE = 76;

const ILLUSTRATIONS: Record<Exclude<SlideId, 'welcome'>, ReactNode> = {
  explore: (
    <IllustrationCircle>
      <MapIcon color={colors.primary} size={ICON_SIZE} />
    </IllustrationCircle>
  ),
  collect: (
    <IllustrationCircle>
      <GlobeIcon color={colors.primary} size={ICON_SIZE} />
    </IllustrationCircle>
  ),
  trade: <TradeIllustration />,
};

/**
 * Onboarding + entrada: 3 telas de apresentação (swipe, "Próximo" ou "Pular") e a tela de boas-vindas
 * com os botões de entrada. Depois de vista uma vez, abre direto na boas-vindas.
 */
export default function LoginScreen() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const session = useSession();
  const guest = useSignInAsGuest();
  const onboardingSeen = useOnboardingSeen();
  const markSeen = useMarkOnboardingSeen();

  // Fixado na montagem: gravar a flag durante o uso não deve mover o carrossel.
  const [initialIndex] = useState(() => (onboardingSeen.data ? LAST_INDEX : 0));
  const [index, setIndex] = useState(initialIndex);

  const listRef = useAnimatedRef<Animated.FlatList<SlideId>>();
  const scrollX = useSharedValue(initialIndex * width);
  const markedRef = useRef(false);

  const onPageChange = (page: number) => {
    setIndex(page);
    if (page === LAST_INDEX && !onboardingSeen.data && !markedRef.current) {
      markedRef.current = true;
      markSeen.mutate();
    }
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
    onMomentumEnd: (event) => {
      scheduleOnRN(onPageChange, Math.round(event.contentOffset.x / width));
    },
  });

  const goTo = (page: number) => {
    listRef.current?.scrollToIndex({ index: page, animated: true });
    // O fim de um scroll programático nem sempre dispara onMomentumEnd (Android).
    onPageChange(page);
  };

  const playAsGuest = () => {
    // Já tem sessão (onboarding aberto na inicialização): segue com ela, sem criar outro convidado.
    if (session.isReady) {
      router.replace('/map');
      return;
    }
    guest.mutate(undefined, {
      onSuccess: () => router.replace('/map'),
    });
  };

  // "Pular" e "Próximo" somem ao chegar na boas-vindas, acompanhando o swipe.
  const introControlsStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, [(LAST_INDEX - 1) * width, LAST_INDEX * width], [1, 0], Extrapolation.CLAMP),
  }));

  const onIntro = index < LAST_INDEX;

  const renderSlide = ({ item }: { item: SlideId }) => {
    if (item !== 'welcome') {
      return (
        <OnboardingSlide
          width={width}
          illustration={ILLUSTRATIONS[item]}
          title={t(`onboarding.slides.${item}.title`)}
          description={t(`onboarding.slides.${item}.description`)}
        />
      );
    }

    return (
      <OnboardingSlide
        width={width}
        illustration={
          <IllustrationCircle size={WELCOME_CIRCLE_SIZE}>
            <UsersIcon color={colors.primary} size={WELCOME_ICON_SIZE} />
          </IllustrationCircle>
        }
        title={t('onboarding.slides.welcome.title')}
        description={t('onboarding.slides.welcome.description')}>
        <Animated.View entering={listItemEntering(3)} style={styles.authButtons}>
          {/* Apple (só iOS) e Google: vinculam o email; se a conta já existia, entra nela. */}
          <SocialAuthButtons onLinked={() => router.replace('/map')} disabled={guest.isPending} />
          <AuthButton
            label={t('onboarding.continueAsGuest')}
            variant="secondary"
            icon={<UsersIcon color={colors.foreground} size={18} />}
            onPress={playAsGuest}
            loading={guest.isPending}
          />
          {guest.isError && <Text style={styles.error}>{t('common.loadError')}</Text>}
        </Animated.View>
      </OnboardingSlide>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <BackgroundOrbs />

      <Animated.View style={[styles.top, introControlsStyle]} pointerEvents={onIntro ? 'auto' : 'none'}>
        <Pressable accessibilityRole="button" hitSlop={12} onPress={() => goTo(LAST_INDEX)}>
          <Text style={styles.skip}>{t('onboarding.skip')}</Text>
        </Pressable>
      </Animated.View>

      <Animated.FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        initialScrollIndex={initialIndex}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        style={styles.list}
      />

      <View style={styles.bottom}>
        <PageDots count={SLIDES.length} scrollX={scrollX} pageWidth={width} />
        <Animated.View style={introControlsStyle} pointerEvents={onIntro ? 'auto' : 'none'}>
          <AuthButton
            label={t('onboarding.next')}
            icon={<ChevronRightIcon color={colors.primaryForeground} size={20} />}
            iconPosition="right"
            onPress={() => goTo(Math.min(index + 1, LAST_INDEX))}
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  top: {
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 8,
    height: 36,
  },
  skip: {
    color: colors.secondaryForeground,
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  authButtons: {
    gap: 12,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    textAlign: 'center',
  },
  bottom: {
    gap: 24,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
});

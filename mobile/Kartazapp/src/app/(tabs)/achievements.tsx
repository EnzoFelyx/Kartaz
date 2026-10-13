import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthButton } from '@/components/auth/auth-button';
import { TAB_BAR_BOTTOM_GAP, TAB_BAR_HEIGHT } from '@/components/tab-bar';
import { TOAST_VARIANTS } from '@/components/toast/toast-variants';
import { GradientBorder } from '@/components/ui/gradient-border';
import { GradientBox } from '@/components/ui/gradient-box';
import { toast, type ToastOptions, type ToastVariant } from '@/lib/toast/toast-store';
import { colors } from '@/theme/colors';
import { listItemEntering } from '@/utils/list-loading';

/*
 * TEMPORÁRIO: tela de teste dos toasts no lugar de Conquistas (textos fixos, sem i18n).
 * Voltar para o ScreenPlaceholder de conquistas quando os toasts estiverem validados.
 */

const CARD_RADIUS = 18;
const ICON_BOX_SIZE = 48;

const SAMPLES: Record<ToastVariant, { label: string; toast: ToastOptions }> = {
  success: {
    label: 'Success Toast',
    toast: { title: 'Carta encontrada!', message: 'Você descobriu Mbappé na França!' },
  },
  error: {
    label: 'Error Toast',
    toast: { title: 'Falha na conexão', message: 'Não foi possível falar com o servidor.' },
  },
  warning: { label: 'Warning Toast', toast: { title: 'Energia baixa', message: 'Restam só 10% de energia.' } },
  info: { label: 'Info Toast', toast: { title: 'Escaneando...', message: 'Procurando cartas por perto...' } },
  reward: { label: 'Reward Toast', toast: { title: 'Nova conquista!', message: 'Explorador iniciante: +50 XP' } },
};

const VARIANTS = Object.keys(SAMPLES) as ToastVariant[];

function triggerMultiple() {
  toast.info('Escaneando...', 'Procurando cartas por perto...', { duration: 2500 });
  setTimeout(() => toast.success('Carta encontrada!', 'Você descobriu Mbappé na França!'), 1200);
  setTimeout(() => toast.reward('Nova conquista!', 'Primeira carta lendária: +100 XP'), 2400);
}

export default function AchievementsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + TAB_BAR_BOTTOM_GAP + TAB_BAR_HEIGHT + 24 },
      ]}>
      <Animated.View entering={listItemEntering(0)} style={styles.header}>
        <Text style={styles.title}>Toast Notifications</Text>
        <Text style={styles.subtitle}>Toque em um card para disparar um toast</Text>
      </Animated.View>

      {VARIANTS.map((variant, index) => {
        const style = TOAST_VARIANTS[variant];
        return (
          <Animated.View key={variant} entering={listItemEntering(index + 1)}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={SAMPLES[variant].label}
              onPress={() => toast.show({ ...SAMPLES[variant].toast, variant })}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
              <GradientBorder colors={style.gradient} radius={CARD_RADIUS} width={2} />
              <GradientBox
                width={ICON_BOX_SIZE}
                height={ICON_BOX_SIZE}
                radius={14}
                colors={style.gradient}>
                {style.icon(colors.white, 22)}
              </GradientBox>
              <View style={styles.texts}>
                <Text style={styles.cardTitle}>{SAMPLES[variant].label}</Text>
                <Text style={styles.cardSubtitle}>Toque para testar</Text>
              </View>
            </Pressable>
          </Animated.View>
        );
      })}

      <Animated.View entering={listItemEntering(6)} style={styles.multiple}>
        <Text style={styles.sectionTitle}>Múltiplos toasts</Text>
        <AuthButton label="Disparar vários toasts" onPress={triggerMultiple} />
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 20,
    gap: 14,
  },
  header: {
    gap: 6,
    marginBottom: 8,
  },
  title: {
    color: colors.foreground,
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.secondaryForeground,
    fontSize: 15,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 18,
    borderRadius: CARD_RADIUS,
    backgroundColor: colors.card,
  },
  pressed: {
    opacity: 0.8,
  },
  texts: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    color: colors.foreground,
    fontSize: 17,
    fontWeight: '800',
  },
  cardSubtitle: {
    color: colors.secondaryForeground,
    fontSize: 13,
  },
  multiple: {
    gap: 14,
    marginTop: 12,
  },
  sectionTitle: {
    color: colors.foreground,
    fontSize: 20,
    fontWeight: '800',
  },
});

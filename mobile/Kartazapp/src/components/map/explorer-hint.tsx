import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';

import { InfoIcon } from '@/components/icons/info-icon';
import { colors, withAlpha } from '@/theme/colors';

export type ExplorerHintVariant = 'zoomIn' | 'noEnergy';

type ExplorerHintProps = {
  variant: ExplorerHintVariant;
  style?: StyleProp<ViewStyle>;
};

/**
 * Aviso acima do painel do mapa:
 * - `zoomIn`: Explore Mode OFF (zoom afastado) — aproxime para voltar a jogar.
 * - `noEnergy`: Explore ON sem energia — não dá para se mover.
 * O (i) abre a explicação do Explore Mode.
 */
export function ExplorerHint({ variant, style }: ExplorerHintProps) {
  const { t } = useTranslation();
  const [infoOpen, setInfoOpen] = useState(false);
  const isWarning = variant === 'noEnergy';

  return (
    <>
      <Animated.View
        entering={FadeInDown.duration(200)}
        exiting={FadeOutDown.duration(150)}
        style={[styles.bar, isWarning && styles.warningBar, style]}
        accessibilityRole="alert">
        <Text style={[styles.text, isWarning && styles.warningText]} numberOfLines={2}>
          {t(isWarning ? 'explorer.noEnergy' : 'explorer.hint')}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('explorer.infoA11y')}
          hitSlop={8}
          onPress={() => setInfoOpen(true)}
          style={styles.infoButton}>
          <InfoIcon color={isWarning ? colors.accent : colors.primary} size={22} />
        </Pressable>
      </Animated.View>

      <Modal visible={infoOpen} transparent animationType="fade" onRequestClose={() => setInfoOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setInfoOpen(false)}>
          <Pressable style={styles.card} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.title}>{t('explorer.infoTitle')}</Text>
            <Text style={styles.body}>{t('explorer.infoBody')}</Text>
            <Pressable accessibilityRole="button" onPress={() => setInfoOpen(false)} style={styles.closeButton}>
              <Text style={styles.closeText}>{t('explorer.close')}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingLeft: 16,
    paddingRight: 12,
    borderRadius: 18,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: withAlpha(colors.primary, 0.2),
  },
  warningBar: {
    borderColor: withAlpha(colors.accent, 0.5),
  },
  text: {
    flex: 1,
    color: colors.foreground,
    fontSize: 14,
  },
  warningText: {
    color: colors.accent,
    fontWeight: '700',
  },
  infoButton: {
    padding: 2,
  },
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: withAlpha(colors.deep, 0.7),
  },
  card: {
    maxWidth: 360,
    padding: 20,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: withAlpha(colors.primary, 0.25),
  },
  title: {
    marginBottom: 12,
    color: colors.foreground,
    fontSize: 17,
    fontWeight: '800',
  },
  body: {
    marginBottom: 20,
    color: colors.secondaryForeground,
    fontSize: 15,
    lineHeight: 22,
  },
  closeButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  closeText: {
    color: colors.primarySoft,
    fontSize: 15,
    fontWeight: '700',
  },
});

import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ArrowLeftIcon } from '@/components/icons/arrow-left-icon';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

import { IconButton } from './icon-button';

/** Largura do botão de voltar: a ação da direita reserva o mesmo espaço para o título ficar no centro. */
const BACK_SIZE = 44;

type ScreenHeaderProps = {
  title: string;
  /** Linha menor abaixo do título (ex.: "35 cartas"). */
  subtitle?: string;
  /**
   * `left`: título grande à esquerda, ao lado do voltar (listas: Minha Coleção, Seleção).
   * `center`: título no centro, com a ação à direita (edição: Salvar).
   */
  align?: 'left' | 'center';
  /** Ação à direita (ex.: Salvar). */
  right?: ReactNode;
  onBack: () => void;
  style?: StyleProp<ViewStyle>;
};

/** Cabeçalho das telas empilhadas: voltar, título (e subtítulo) e uma ação opcional, com a área segura do topo. */
export function ScreenHeader({ title, subtitle, align = 'left', right, onBack, style }: ScreenHeaderProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const centered = align === 'center';

  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }, style]}>
      <IconButton
        icon={<ArrowLeftIcon color={colors.foreground} />}
        accessibilityLabel={t('common.goBack')}
        onPress={onBack}
      />
      <View style={[styles.titles, centered && styles.titlesCentered]}>
        <Text style={centered ? styles.titleCentered : styles.title} accessibilityRole="header" numberOfLines={1}>
          {title}
        </Text>
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {centered ? <View style={styles.right}>{right}</View> : right}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: spacing.screen,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titles: {
    flex: 1,
    gap: 2,
  },
  titlesCentered: {
    alignItems: 'center',
  },
  title: {
    color: colors.foreground,
    fontSize: 22,
    fontWeight: '900',
  },
  titleCentered: {
    color: colors.foreground,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.secondaryForeground,
    fontSize: 14,
  },
  right: {
    minWidth: BACK_SIZE,
    alignItems: 'flex-end',
  },
});

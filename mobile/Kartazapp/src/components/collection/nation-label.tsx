import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';

import { colors } from '@/theme/colors';
import { getNationName } from '@/utils/card-labels';
import { getFlagEmojiForCountry } from '@/utils/flags';

type NationLabelProps = {
  /** Seleção como vem do backend (nome ou código); vazia/nula não mostra nada. */
  nation: string | null | undefined;
  style?: StyleProp<TextStyle>;
};

/** Seleção do jogador: bandeira (se reconhecida) + nome no idioma do app, em roxo. */
export function NationLabel({ nation, style }: NationLabelProps) {
  const value = nation?.trim();
  if (!value) return null;
  const flag = getFlagEmojiForCountry(value);
  return (
    <Text style={[styles.label, style]} numberOfLines={1}>
      {flag ? `${flag} ` : ''}
      {getNationName(value)}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: {
    color: colors.violet,
    fontSize: 12,
    fontWeight: '700',
  },
});

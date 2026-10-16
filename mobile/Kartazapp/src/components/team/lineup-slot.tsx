import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { NationLabel } from '@/components/collection/nation-label';
import { PlayerThumb } from '@/components/collection/player-thumb';
import { SwapIcon } from '@/components/icons/swap-icon';
import { playerPhotoUri } from '@/lib/api/image-uri';
import type { UserInstanceDto } from '@/lib/api/user-instances-api';
import { colors } from '@/theme/colors';

const THUMB_SIZE = 56;

type LineupSlotProps = {
  /** Posição no time (1 a 5). */
  index: number;
  instance: UserInstanceDto;
  /** Abre a escolha de outro jogador para esta posição. */
  onSwap?: () => void;
  /** Linha da lista de escolha: o toque inteiro seleciona e não mostra a posição. */
  onSelect?: () => void;
};

/**
 * Titular do time (ou opção na escolha de jogador): foto, posição, nome, overall e seleção (bandeira
 * + nome; a seleção pesa no bônus do time). Com `onSwap`, o ícone de troca abre a escolha; com
 * `onSelect`, vira uma linha simples da lista de escolha.
 */
export function LineupSlot({ index, instance, onSwap, onSelect }: LineupSlotProps) {
  const { t } = useTranslation();
  const { card } = instance;

  const content = (
    <>
      <PlayerThumb uri={playerPhotoUri(card.id, card.url)} size={THUMB_SIZE} />
      <View style={styles.texts}>
        {!onSelect && <Text style={styles.position}>{t('team.slot', { index }).toUpperCase()}</Text>}
        <Text style={styles.name} numberOfLines={1}>
          {card.name}
        </Text>
        <Text style={styles.ovr}>{t('team.ovr', { ovr: card.ovr ?? '—' })}</Text>
        <NationLabel nation={card.nation} />
      </View>
      {onSwap && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('team.swapA11y', { name: card.name })}
          onPress={onSwap}
          hitSlop={10}
          style={({ pressed }) => [styles.swap, pressed && styles.pressed]}>
          <SwapIcon color={colors.primary} size={22} />
        </Pressable>
      )}
    </>
  );

  if (onSelect) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${card.name}, ${t('team.ovr', { ovr: card.ovr ?? '—' })}`}
        onPress={onSelect}
        style={({ pressed }) => [styles.row, styles.flat, pressed && styles.pressed]}>
        {content}
      </Pressable>
    );
  }
  return <View style={styles.row}>{content}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 12,
    borderRadius: 18,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
  },
  // Linha da lista de escolha: sem caixa, separada por traço (o separador é da lista).
  flat: {
    paddingHorizontal: 4,
    borderRadius: 0,
    backgroundColor: colors.transparent,
    borderWidth: 0,
  },
  pressed: {
    opacity: 0.7,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  position: {
    color: colors.secondaryForeground,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  name: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '800',
  },
  ovr: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  swap: {
    padding: 6,
  },
});

import { useTranslation } from 'react-i18next';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { UserInstanceDto } from '@/lib/api/user-instances-api';
import { colors, withAlpha } from '@/theme/colors';

import { LineupSlot } from './lineup-slot';

type PlayerPickerModalProps = {
  /** Posição sendo trocada (1 a 5); `null` fecha o modal. */
  slotIndex: number | null;
  /** Cartas que podem entrar (já sem os titulares e sem jogadores repetidos). */
  candidates: UserInstanceDto[];
  onSelect: (instance: UserInstanceDto) => void;
  onClose: () => void;
};

/**
 * Escolha do jogador para uma posição do time: painel que sobe de baixo com as cartas do usuário
 * fora do time, por overall. Toque fora do painel fecha.
 */
export function PlayerPickerModal({ slotIndex, candidates, onSelect, onClose }: PlayerPickerModalProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={slotIndex !== null} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={t('common.close')} />
      <Animated.View entering={SlideInDown.duration(280)} style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.handle} />
        <Text style={styles.title} accessibilityRole="header">
          {t('team.pickerTitle')}
        </Text>
        <FlatList
          data={candidates}
          keyExtractor={(instance) => instance.id}
          renderItem={({ item }) => <LineupSlot index={0} instance={item} onSelect={() => onSelect(item)} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={<Text style={styles.empty}>{t('team.pickerEmpty')}</Text>}
          contentContainerStyle={styles.list}
        />
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: withAlpha(colors.deep, 0.7),
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '72%',
    paddingHorizontal: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.border,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    marginTop: 10,
    borderRadius: 2,
    backgroundColor: colors.subtle,
  },
  title: {
    marginTop: 16,
    marginBottom: 8,
    color: colors.foreground,
    fontSize: 18,
    fontWeight: '800',
  },
  list: {
    paddingBottom: 8,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
  },
  empty: {
    marginVertical: 24,
    color: colors.mutedForeground,
    fontSize: 14,
    textAlign: 'center',
  },
});

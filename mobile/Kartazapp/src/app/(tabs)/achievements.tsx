import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthButton } from '@/components/auth/auth-button';
import { CardsPackModal } from '@/components/cards/cards-pack-modal';
import { TAB_BAR_BOTTOM_GAP, TAB_BAR_HEIGHT } from '@/components/tab-bar';
import type { CardsPack, SerialClass } from '@/lib/colyseus/types';
import { getRandomPlayers } from '@/lib/db/playersDb';
import { colors } from '@/theme/colors';
import { listItemEntering } from '@/utils/list-loading';

/*
 * TEMPORÁRIO: tela de teste do pack de cartas no lugar de Conquistas (textos fixos, sem i18n).
 * Voltar para o ScreenPlaceholder de conquistas quando o pack estiver validado.
 */

/** Pack de teste com jogadores aleatórios do SQLite, passando pelas três classes de série. */
function mockPack(type: CardsPack['type'], size: number): CardsPack {
  const classes: SerialClass[] = ['standard', 'elite', 'extreme'];
  return {
    type,
    cards: getRandomPlayers(size).map((player, index) => {
      const serialClass = classes[index % classes.length];
      const serialMax = player.maxSupply ?? 1000;
      const serialNumber = serialClass === 'extreme' ? 1 : serialClass === 'elite' ? 3 : 50 + index;
      return { id: `mock-${Date.now()}-${index}`, cardId: player.id, serialNumber, serialMax, serialClass };
    }),
  };
}

export default function AchievementsScreen() {
  const insets = useSafeAreaInsets();
  const [pack, setPack] = useState<CardsPack | null>(null);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + TAB_BAR_BOTTOM_GAP + TAB_BAR_HEIGHT + 24 },
      ]}>
      <Animated.View entering={listItemEntering(0)} style={styles.header}>
        <Text style={styles.title}>Pack de cartas</Text>
        <Text style={styles.subtitle}>Toque para abrir um pack de teste</Text>
      </Animated.View>

      <Animated.View entering={listItemEntering(1)} style={styles.buttons}>
        <AuthButton label="Boas-vindas (5 cartas)" onPress={() => setPack(mockPack('initial', 5))} />
        <AuthButton label="Diário (2 cartas)" variant="secondary" onPress={() => setPack(mockPack('daily', 2))} />
      </Animated.View>

      <CardsPackModal pack={pack} onClose={() => setPack(null)} />
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
  buttons: {
    gap: 14,
  },
});

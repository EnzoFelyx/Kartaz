import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PlayerCardRow } from '@/components/collection/player-card-row';
import { PlayerCardTile } from '@/components/collection/player-card-tile';
import { StatCard } from '@/components/collection/stat-card';
import { ViewModeToggle, type ViewMode } from '@/components/collection/view-mode-toggle';
import { TAB_BAR_BOTTOM_GAP, TAB_BAR_HEIGHT } from '@/components/tab-bar';
import { SearchInput } from '@/components/ui/search-input';
import { MOCK_PLAYER_CARDS } from '@/mocks/player-cards';
import type { PlayerCard } from '@/types/player-card';
import { colors, rarityColors } from '@/theme/colors';

const GAP = 12;
const H_PADDING = 20;
const GRID_COLUMNS = 2;

/** Animação dos cards: entram subindo (em cascata) e saem descendo. */
const CARD_STAGGER_MS = 60;
const CARD_MAX_DELAY_MS = 480;
const CARD_ENTER_MS = 350;
const CARD_EXIT_MS = 200;

function cardEntering(position: number) {
  return FadeInDown.delay(Math.min(position * CARD_STAGGER_MS, CARD_MAX_DELAY_MS)).duration(CARD_ENTER_MS);
}
const cardExiting = FadeOutDown.duration(CARD_EXIT_MS);

/**
 * Linha da lista: no modo grade agrupa 2 cartas por linha.
 * Montamos as linhas à mão (em vez de trocar `numColumns`) porque mudar `numColumns`
 * exige remontar o FlatList — o que remontaria o header e cortaria a animação do toggle.
 */
type CollectionRow = { key: string; cards: PlayerCard[] };

function toRows(cards: PlayerCard[], perRow: number): CollectionRow[] {
  const rows: CollectionRow[] = [];
  for (let i = 0; i < cards.length; i += perRow) {
    const chunk = cards.slice(i, i + perRow);
    rows.push({ key: chunk.map((card) => card.id).join('-'), cards: chunk });
  }
  return rows;
}

export default function CollectionScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Stats calculados do mock (no futuro vêm da store/servidor).
  const stats = useMemo(
    () => ({
      total: MOCK_PLAYER_CARDS.length,
      legendary: MOCK_PLAYER_CARDS.filter((card) => card.rarity === 'legendary').length,
      rare: MOCK_PLAYER_CARDS.filter((card) => card.rarity === 'rare').length,
    }),
    [],
  );

  const cards = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return MOCK_PLAYER_CARDS;
    return MOCK_PLAYER_CARDS.filter(
      (card) => card.name.toLowerCase().includes(term) || card.nation.toLowerCase().includes(term),
    );
  }, [query]);

  const isGrid = viewMode === 'grid';
  const openCard = (id: string) => router.push({ pathname: '/card/[id]', params: { id } });
  const rows = useMemo(() => toRows(cards, isGrid ? GRID_COLUMNS : 1), [cards, isGrid]);

  // Elemento (não função) para o TextInput não perder o foco a cada letra digitada.
  const header = (
    <View style={styles.header}>
      <View style={styles.titles}>
        {/* Toggle na mesma linha do título, centralizado com ele. */}
        <View style={styles.titleRow}>
          <Text style={styles.title} accessibilityRole="header">
            Collection
          </Text>
          <ViewModeToggle value={viewMode} onChange={setViewMode} />
        </View>
        <Text style={styles.subtitle}>Manage your player cards</Text>
      </View>

      <SearchInput value={query} onChangeText={setQuery} placeholder="Search players..." />

      <View style={styles.stats}>
        <StatCard value={stats.total} label="Total Cards" />
        <StatCard value={stats.legendary} label="Legendary" valueColor={rarityColors.legendary} />
        <StatCard value={stats.rare} label="Rare" valueColor={rarityColors.rare} />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Animated.FlatList
        data={rows}
        keyExtractor={(row) => `${viewMode}-${row.key}`}
        ListHeaderComponent={header}
        ListEmptyComponent={<Text style={styles.empty}>No players found</Text>}
        renderItem={({ item: row, index }) =>
          isGrid ? (
            <View style={styles.gridRow}>
              {row.cards.map((card, column) => (
                <Animated.View
                  key={card.id}
                  style={styles.gridCell}
                  entering={cardEntering(index * GRID_COLUMNS + column)}
                  exiting={cardExiting}>
                  <PlayerCardTile card={card} onPress={() => openCard(card.id)} />
                </Animated.View>
              ))}
              {/* Mantém a última carta com meia largura quando a linha fica incompleta. */}
              {row.cards.length < GRID_COLUMNS && <View style={styles.gridCell} />}
            </View>
          ) : (
            <Animated.View entering={cardEntering(index)} exiting={cardExiting}>
              <PlayerCardRow card={row.cards[0]} onPress={() => openCard(row.cards[0].id)} />
            </Animated.View>
          )
        }
        ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + TAB_BAR_BOTTOM_GAP + TAB_BAR_HEIGHT + 24,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: H_PADDING,
  },
  header: {
    gap: 20,
    marginBottom: 16,
  },
  titles: {
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    flex: 1,
    color: colors.foreground,
    fontSize: 34,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.secondaryForeground,
    fontSize: 16,
  },
  stats: {
    flexDirection: 'row',
    gap: GAP,
  },
  gridRow: {
    flexDirection: 'row',
    gap: GAP,
  },
  gridCell: {
    flex: 1,
  },
  empty: {
    marginTop: 24,
    textAlign: 'center',
    color: colors.mutedForeground,
    fontSize: 14,
  },
});

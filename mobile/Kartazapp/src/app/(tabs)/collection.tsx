import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MyCollectionButton } from '@/components/collection/my-collection-button';
import { NationRow } from '@/components/collection/nation-row';
import { PlayerCardRow } from '@/components/collection/player-card-row';
import { PlayerCardTile } from '@/components/collection/player-card-tile';
import { ViewModeToggle, type ViewMode } from '@/components/collection/view-mode-toggle';
import { TAB_BAR_BOTTOM_GAP, TAB_BAR_HEIGHT } from '@/components/tab-bar';
import { SearchInput } from '@/components/ui/search-input';
import { MOCK_NATIONS, type Nation } from '@/mocks/nations';
import { MOCK_PLAYER_CARDS } from '@/mocks/player-cards';
import type { PlayerCard } from '@/types/player-card';
import { colors } from '@/theme/colors';
import { compareLocale, getNationName } from '@/utils/card-labels';

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
type CollectionRow =
  | { type: 'cards'; key: string; cards: PlayerCard[] }
  | { type: 'nation'; key: string; nation: Nation; name: string };

function toCardRows(cards: PlayerCard[], perRow: number): CollectionRow[] {
  const rows: CollectionRow[] = [];
  for (let i = 0; i < cards.length; i += perRow) {
    const chunk = cards.slice(i, i + perRow);
    rows.push({ type: 'cards', key: chunk.map((card) => card.id).join('-'), cards: chunk });
  }
  return rows;
}

export default function CollectionScreen() {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const isGrid = viewMode === 'grid';
  const isNations = viewMode === 'nations';
  const openCard = (id: string) => router.push({ pathname: '/card/[id]', params: { id } });

  // Jogadores (grade/lista) e seleções (globo) são buscas diferentes: ao cruzar entre
  // esses dois grupos, limpa o campo. Entre grade e lista a busca é mantida.
  const changeViewMode = (mode: ViewMode) => {
    if ((mode === 'nations') !== isNations) setQuery('');
    setViewMode(mode);
  };

  // Seleções com o nome no idioma atual, em ordem alfabética desse idioma.
  const sortedNations = useMemo(
    () =>
      MOCK_NATIONS.map((nation) => ({ nation, name: getNationName(nation.code) })).sort((a, b) =>
        compareLocale(a.name, b.name),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recalcula ao trocar o idioma
    [i18n.language],
  );

  // A mesma busca filtra jogadores (grade/lista) ou seleções (países).
  const rows = useMemo<CollectionRow[]>(() => {
    const term = query.trim().toLowerCase();
    if (isNations) {
      return sortedNations
        .filter(({ name }) => name.toLowerCase().includes(term))
        .map(({ nation, name }) => ({ type: 'nation', key: nation.code, nation, name }));
    }
    const cards = term
      ? MOCK_PLAYER_CARDS.filter(
          (card) => card.name.toLowerCase().includes(term) || getNationName(card.nationCode).toLowerCase().includes(term),
        )
      : MOCK_PLAYER_CARDS;
    return toCardRows(cards, isGrid ? GRID_COLUMNS : 1);
  }, [query, isGrid, isNations, sortedNations]);

  // Elemento (não função) para o TextInput não perder o foco a cada letra digitada.
  const header = (
    <View style={styles.header}>
      <View style={styles.titles}>
        {/* Toggle na mesma linha do título, centralizado com ele. */}
        <View style={styles.titleRow}>
          <Text style={styles.title} accessibilityRole="header">
            {t('cards.title')}
          </Text>
          <ViewModeToggle value={viewMode} onChange={changeViewMode} />
        </View>
        <Text style={styles.subtitle}>{t('cards.subtitle')}</Text>
      </View>

      {/* Contagem vem do mock da coleção. */}
      <MyCollectionButton
        count={MOCK_PLAYER_CARDS.length}
        onPress={() => router.push('/my-collection')}
      />

      <SearchInput
        value={query}
        onChangeText={setQuery}
        placeholder={isNations ? t('cards.searchTeam') : t('cards.searchPlayers')}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <Animated.FlatList
        data={rows}
        keyExtractor={(row) => `${viewMode}-${row.key}`}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <Text style={styles.empty}>{isNations ? t('cards.noTeams') : t('cards.noPlayers')}</Text>
        }
        renderItem={({ item: row, index }) =>
          row.type === 'nation' ? (
            <Animated.View entering={cardEntering(index)} exiting={cardExiting}>
              <NationRow
                name={row.name}
                onPress={() =>
                  router.push({ pathname: '/nation/[code]', params: { code: row.nation.code } })
                }
              />
            </Animated.View>
          ) : isGrid ? (
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

import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OwnedCardItem } from '@/components/collection/owned-card-item';
import { ArrowLeftIcon } from '@/components/icons/arrow-left-icon';
import { IconButton } from '@/components/ui/icon-button';
import { SearchInput } from '@/components/ui/search-input';
import { MOCK_PLAYER_CARDS } from '@/mocks/player-cards';
import { colors } from '@/theme/colors';

const GAP = 14;
const H_PADDING = 20;

/** Cards entram subindo em cascata e saem descendo (mesmo padrão da aba Cards). */
const CARD_STAGGER_MS = 60;
const CARD_MAX_DELAY_MS = 480;

function cardEntering(index: number) {
  return FadeInDown.delay(Math.min(index * CARD_STAGGER_MS, CARD_MAX_DELAY_MS)).duration(350);
}
const cardExiting = FadeOutDown.duration(200);

/** Coleção do jogador: as cópias de carta que ele possui. */
export default function MyCollectionScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  // Mock: por enquanto, todas as cartas do mock são da coleção do jogador.
  const ownedCards = MOCK_PLAYER_CARDS;

  // Busca por nome do jogador ou pela seleção (time/nacionalidade).
  const cards = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return ownedCards;
    return ownedCards.filter(
      (card) => card.name.toLowerCase().includes(term) || card.nation.toLowerCase().includes(term),
    );
  }, [query, ownedCards]);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/collection'));
  const openCard = (id: string) => router.push({ pathname: '/card/[id]', params: { id } });

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <IconButton
          icon={<ArrowLeftIcon color={colors.foreground} />}
          accessibilityLabel="Go back"
          onPress={goBack}
        />
        <View style={styles.titles}>
          <Text style={styles.title} accessibilityRole="header">
            My Collection
          </Text>
          <Text style={styles.subtitle}>{ownedCards.length} cards</Text>
        </View>
      </View>

      <Animated.FlatList
        data={cards}
        keyExtractor={(card) => card.id}
        ListHeaderComponent={
          <SearchInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by player or team..."
            style={styles.search}
          />
        }
        ListEmptyComponent={<Text style={styles.empty}>No cards found</Text>}
        renderItem={({ item, index }) => (
          <Animated.View entering={cardEntering(index)} exiting={cardExiting}>
            <OwnedCardItem card={item} onPress={() => openCard(item.id)} />
          </Animated.View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: H_PADDING,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titles: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.foreground,
    fontSize: 22,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.secondaryForeground,
    fontSize: 14,
  },
  content: {
    paddingHorizontal: H_PADDING,
    paddingTop: 20,
  },
  search: {
    marginBottom: 20,
  },
  empty: {
    marginTop: 24,
    textAlign: 'center',
    color: colors.mutedForeground,
    fontSize: 14,
  },
});

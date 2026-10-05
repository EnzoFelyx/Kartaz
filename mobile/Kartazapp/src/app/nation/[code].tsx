import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PlayerCardRow } from '@/components/collection/player-card-row';
import { ArrowLeftIcon } from '@/components/icons/arrow-left-icon';
import { IconButton } from '@/components/ui/icon-button';
import { SearchInput } from '@/components/ui/search-input';
import { getPlayerCardById } from '@/mocks/player-cards';
import { getNationByCode, getPlayersByNation } from '@/mocks/players';
import { colors } from '@/theme/colors';
import { getNationName } from '@/utils/card-labels';

const GAP = 12;
const H_PADDING = 20;

/** Mesmo padrão de entrada/saída das listas da aba Cards. */
const CARD_STAGGER_MS = 60;
const CARD_MAX_DELAY_MS = 480;

function cardEntering(index: number) {
  return FadeInDown.delay(Math.min(index * CARD_STAGGER_MS, CARD_MAX_DELAY_MS)).duration(350);
}
const cardExiting = FadeOutDown.duration(200);

/** Todos os jogadores de uma seleção (catálogo completo, não só a coleção). */
export default function NationScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  const nation = code ? getNationByCode(code) : undefined;
  const allPlayers = useMemo(() => (code ? getPlayersByNation(code) : []), [code]);

  const players = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return allPlayers;
    return allPlayers.filter((player) => player.name.toLowerCase().includes(term));
  }, [query, allPlayers]);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/collection'));

  // Só jogadores da coleção têm uma cópia para abrir nos detalhes.
  const openIfOwned = (id: string) => {
    if (getPlayerCardById(id)) router.push({ pathname: '/card/[id]', params: { id } });
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <IconButton
          icon={<ArrowLeftIcon color={colors.foreground} />}
          accessibilityLabel={t('common.goBack')}
          onPress={goBack}
        />
        <View style={styles.titles}>
          <Text style={styles.title} accessibilityRole="header" numberOfLines={1}>
            {nation ? getNationName(nation.code) : t('nation.unknown')}
          </Text>
          <Text style={styles.subtitle}>{t('common.playersCount', { count: allPlayers.length })}</Text>
        </View>
      </View>

      <Animated.FlatList
        data={players}
        keyExtractor={(player) => player.id}
        ListHeaderComponent={
          <SearchInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('cards.searchPlayers')}
            style={styles.search}
          />
        }
        ListEmptyComponent={<Text style={styles.empty}>{t('cards.noPlayers')}</Text>}
        renderItem={({ item, index }) => (
          <Animated.View entering={cardEntering(index)} exiting={cardExiting}>
            <PlayerCardRow card={item} onPress={() => openIfOwned(item.id)} />
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

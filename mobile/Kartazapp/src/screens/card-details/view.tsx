import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CardActions } from '@/components/card-details/card-actions';
import { CardHero } from '@/components/card-details/card-hero';
import { CardIdentity } from '@/components/card-details/card-identity';
import { CardInfoSection } from '@/components/card-details/card-info-section';
import { GlobalDiscoveryButton } from '@/components/card-details/global-discovery-button';
import { SimilarCardTile } from '@/components/card-details/similar-card-tile';
import { STAT_CONFIG } from '@/components/card-details/stat-config';
import { StatRow } from '@/components/card-details/stat-row';
import { ArrowLeftIcon } from '@/components/icons/arrow-left-icon';
import { HeartIcon } from '@/components/icons/heart-icon';
import { ShareIcon } from '@/components/icons/share-icon';
import { EdgeFade } from '@/components/ui/edge-fade';
import { EntranceView } from '@/components/ui/entrance-view';
import { IconButton } from '@/components/ui/icon-button';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

import type { CardDetailsViewModel } from './use-view-model';

const STAT_ICON_SIZE = 20;

/** Altura do fade no topo da área rolável (Statistics). */
const SCROLL_FADE_HEIGHT = 36;

/**
 * Entrada da tela, igual ao projeto de referência: cada bloco aparece subindo, em sequência.
 * Topo: badges → linha nome/foto → descoberta global; abaixo, a seção de estatísticas,
 * e por fim as barras dos atributos enchem. Começa quando o jogador está pronto (os blocos só
 * montam depois do loading).
 */
const ENTRANCE = {
  badges: { delay: 100, offset: 24 },
  identity: { delay: 220, offset: 24 },
  discovery: { delay: 380, offset: 24 },
  stats: { delay: 150, offset: 20, duration: 350 },
  /** Barras dos atributos começam a encher depois que a seção já apareceu. */
  statBarsDelay: 450,
} as const;

/** Arte com a identidade do jogador, botão de descoberta global, estatísticas, dados da cópia e parecidos. */
export function CardDetailsView({
  card,
  owned,
  loading,
  similar,
  favorite,
  toggleFavorite,
  share,
  goBack,
  openSimilar,
  openFoundCopies,
}: CardDetailsViewModel) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  if (loading) {
    return (
      <View style={[styles.container, styles.notFound]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!card) {
    return (
      <View style={[styles.container, styles.notFound]}>
        <Text style={styles.notFoundText}>{t('cardDetails.notFound')}</Text>
        <IconButton
          icon={<ArrowLeftIcon color={colors.foreground} />}
          accessibilityLabel={t('common.goBack')}
          onPress={goBack}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header fixo: arena + identidade do jogador. Só o conteúdo abaixo rola. */}
      <CardHero height={Math.round(windowHeight * 0.48)}>
        <CardIdentity card={card} entrance={ENTRANCE.identity} badgesEntrance={ENTRANCE.badges} />

        {/* Raridade global do jogador: abre as cópias já encontradas. */}
        <EntranceView {...ENTRANCE.discovery}>
          <GlobalDiscoveryButton found={card.copiesFound} total={card.totalCopies} onPress={openFoundCopies} />
        </EntranceView>
      </CardHero>

      <View style={styles.scrollArea}>
        <ScrollView
          contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}>
          <EntranceView {...ENTRANCE.stats} style={styles.statsSection}>
            <Text style={styles.sectionTitle}>{t('cardDetails.statistics')}</Text>
            {STAT_CONFIG.map((stat) => (
              <StatRow
                key={stat.key}
                label={t(`stats.${stat.key}`)}
                value={card.stats[stat.key]}
                color={stat.color}
                icon={stat.renderIcon(STAT_ICON_SIZE)}
                fillDelay={ENTRANCE.statBarsDelay}
              />
            ))}
          </EntranceView>

          <Text style={[styles.sectionTitle, styles.sectionSpacing]}>{t('cardDetails.cardInfo')}</Text>
          {/* Serial e data de coleta só existem quando o usuário tem uma cópia deste jogador. */}
          <CardInfoSection card={card} owned={owned} />

          <Text style={[styles.sectionTitle, styles.sectionSpacing]}>{t('cardDetails.similarCards')}</Text>
          {/* Sangra até as bordas da tela: a última carta aparece cortada, indicando rolagem. */}
          <FlatList
            horizontal
            data={similar}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => <SimilarCardTile player={item} onPress={() => openSimilar(item.id)} />}
            showsHorizontalScrollIndicator={false}
            style={styles.similarList}
            contentContainerStyle={styles.similarContent}
          />

          <CardActions />
        </ScrollView>

        {/* O conteúdo vai sumindo ao subir por baixo do header. */}
        <EdgeFade edge="top" height={SCROLL_FADE_HEIGHT} />
      </View>

      {/* Ações fixas no topo, por cima da arte. */}
      <View style={[styles.topBar, { top: insets.top + 8 }]} pointerEvents="box-none">
        <IconButton
          icon={<ArrowLeftIcon color={colors.foreground} />}
          accessibilityLabel={t('common.goBack')}
          onPress={goBack}
        />
        <View style={styles.topActions}>
          <IconButton
            icon={<HeartIcon color={favorite ? colors.danger : colors.foreground} filled={favorite} />}
            accessibilityLabel={favorite ? t('cardDetails.removeFavorite') : t('cardDetails.addFavorite')}
            selected={favorite}
            onPress={toggleFavorite}
          />
          <IconButton
            icon={<ShareIcon color={colors.foreground} />}
            accessibilityLabel={t('cardDetails.share')}
            onPress={share}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  notFound: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  notFoundText: {
    color: colors.mutedForeground,
    fontSize: 16,
  },
  topBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  topActions: {
    flexDirection: 'row',
    gap: 12,
  },
  statsSection: {
    gap: 12,
  },
  scrollArea: {
    flex: 1,
  },
  body: {
    gap: 12,
    paddingHorizontal: spacing.screen,
    paddingTop: SCROLL_FADE_HEIGHT / 2 + 12,
  },
  sectionTitle: {
    color: colors.secondaryForeground,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  sectionSpacing: {
    marginTop: 16,
  },
  similarList: {
    marginHorizontal: -spacing.screen,
  },
  similarContent: {
    gap: 14,
    paddingHorizontal: spacing.screen,
  },
});

import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import Animated, { Easing, withTiming, type EntryAnimationsValues } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CardsPackModal } from '@/components/cards/cards-pack-modal';
import { CoinBalance } from '@/components/hud/coin-balance';
import { FuelGauge } from '@/components/hud/fuel-gauge';
import { LevelCard } from '@/components/hud/level-card';
import { RefuelModal } from '@/components/hud/refuel-modal';
import { BatteryIcon } from '@/components/icons/battery-icon';
import { CoinIcon } from '@/components/icons/coin-icon';
import { MapDashboard } from '@/components/map-dashboard';
import { DiscoveryFlagMarker } from '@/components/map/discovery-flag-marker';
import { ExplorerHint } from '@/components/map/explorer-hint';
import { MAP_PLAYER_AVATAR_SIZE, MapAvatar } from '@/components/map/map-avatar';
import { MapCardMarker } from '@/components/map/map-card-marker';
import { MapGradientOverlay } from '@/components/map/map-gradient-overlay';
import { MapGridOverlay } from '@/components/map/map-grid-overlay';
import { OtherPlayerMarker } from '@/components/map/other-player-marker';
import { PickupMarker } from '@/components/map/pickup-marker';
import { TAB_BAR_BOTTOM_GAP, TAB_BAR_HEIGHT } from '@/components/tab-bar';
import { colors } from '@/theme/colors';
import { initialMapRegion, kartazMapStyle, mapViewConfig } from '@/theme/map-styles';

import type { MapViewModel } from './use-view-model';

/** Tamanho dos itens coletáveis no mapa (moedas e baterias). */
const PICKUP_ICON_SIZE = 22;
/** Altura da carta virada no mapa (a largura sai da proporção da carta). */
const MAP_CARD_HEIGHT = 34;
/** Distância entre o painel e a tab bar. */
const DASHBOARD_GAP = 12;

/** Entrada do HUD do topo: escorrega um pouco de cima até a posição, sem mola. */
const HUD_SLIDE_DISTANCE = 32;
const HUD_SLIDE_MS = 600;

function hudTopEntering(_values: EntryAnimationsValues) {
  'worklet';
  const config = { duration: HUD_SLIDE_MS, easing: Easing.out(Easing.cubic) };
  return {
    initialValues: { opacity: 0, transform: [{ translateY: -HUD_SLIDE_DISTANCE }] },
    animations: {
      opacity: withTiming(1, config),
      transform: [{ translateY: withTiming(0, config) }],
    },
  };
}

/** Mapa com os marcadores da sala, o jogador no centro, o HUD do topo, o painel e os modais. */
export function MapScreenView({
  mapRef,
  onMapReady,
  handleRegionChangeComplete,
  radarLocked,
  coins,
  batteries,
  mapCards,
  discoveryFlags,
  otherUsers,
  playerPosition,
  avatarUri,
  avatarName,
  focusCount,
  energy,
  maxEnergy,
  level,
  xp,
  balance,
  lastCoinGain,
  hint,
  placeName,
  difficulty,
  dashboardNearby,
  dashboardCards,
  dashboardFlagOwner,
  distanceKm,
  exploreOn,
  xpProgress,
  radarSearching,
  canRadar,
  radarCooldownSeconds,
  handleRadarSearch,
  refuelOpen,
  openRefuel,
  closeRefuel,
  fillTankPrice,
  roomConnected,
  purchaseFuel,
  visiblePack,
  dismissCardsPack,
}: MapViewModel) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        onMapReady={onMapReady}
        onRegionChangeComplete={handleRegionChangeComplete}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        customMapStyle={kartazMapStyle}
        initialRegion={initialMapRegion}
        {...mapViewConfig}
        // Radar: o mapa não se mexe enquanto as cartas estão reveladas.
        scrollEnabled={!radarLocked}
        zoomEnabled={!radarLocked}>
        {/* Bandeira da área (sala) atual, se ninguém a coletou — como jogadores e cartas, só da própria sala. */}
        {/* Moedas e baterias da sala atual: paradas na coordenada, somem quando alguém coleta. */}
        {coins.map((coin) => (
          <PickupMarker
            key={coin.id}
            latitude={coin.lat}
            longitude={coin.lng}
            size={PICKUP_ICON_SIZE}
            icon={<CoinIcon size={PICKUP_ICON_SIZE} />}
            accessibilityLabel={t('map.coinA11y')}
          />
        ))}
        {batteries.map((battery) => (
          <PickupMarker
            key={battery.id}
            latitude={battery.lat}
            longitude={battery.lng}
            size={PICKUP_ICON_SIZE}
            icon={<BatteryIcon size={PICKUP_ICON_SIZE} />}
            accessibilityLabel={t('map.batteryA11y')}
          />
        ))}
        {mapCards.map((card) => (
          <MapCardMarker key={card.id} card={card} height={MAP_CARD_HEIGHT} accessibilityLabel={t('map.cardA11y')} />
        ))}
        {discoveryFlags.map((flag) => (
          <DiscoveryFlagMarker key={flag.h3Index} flag={flag} accessibilityLabel={t('discoveryFlag.a11y')} />
        ))}
        {otherUsers.map((player) => (
          <OtherPlayerMarker
            key={player.sessionId}
            player={player}
            accessibilityLabel={t('map.playerHere', { name: player.username })}
          />
        ))}
      </MapView>
      <MapGradientOverlay />
      <MapGridOverlay />

      {/* Jogador fixo no centro da tela (o mapa se move por baixo dele). */}
      {playerPosition && (
        <View style={styles.selfAvatar} pointerEvents="none" accessible accessibilityLabel={t('map.youAreHere')}>
          <MapAvatar uri={avatarUri} name={avatarName} size={MAP_PLAYER_AVATAR_SIZE} highlighted halo={false} />
        </View>
      )}

      {/* HUD do topo: Energy à esquerda (ocupa o espaço livre) e Level/XP à direita. */}
      <Animated.View
        key={focusCount}
        entering={hudTopEntering}
        style={[styles.hudTop, { top: insets.top + 8 }]}
        pointerEvents="box-none">
        <View style={styles.hudRow}>
          <FuelGauge fuel={energy} maxFuel={maxEnergy} style={styles.fuel} onPress={openRefuel} />
          <LevelCard level={level} xp={xp} />
        </View>
        {/* Saldo de moedas embaixo do nível, à direita (com o "+N" animado a cada coleta). */}
        <CoinBalance balance={balance} lastGain={lastCoinGain} />
      </Animated.View>

      <View
        style={[styles.bottomHud, { bottom: insets.bottom + TAB_BAR_BOTTOM_GAP + TAB_BAR_HEIGHT + DASHBOARD_GAP }]}
        pointerEvents="box-none">
        {hint && <ExplorerHint key={hint} variant={hint} />}
        <MapDashboard
          location={placeName}
          difficulty={difficulty}
          nearbyCount={dashboardNearby}
          cardsCount={dashboardCards}
          distanceKm={distanceKm}
          flagOwnerName={dashboardFlagOwner}
          exploreOn={exploreOn}
          xpProgress={xpProgress}
          searching={radarSearching}
          canSearch={canRadar}
          radarCooldownSeconds={radarCooldownSeconds}
          onRadarSearch={handleRadarSearch}
        />
      </View>

      {/* Radar ativo: bloqueia qualquer toque na tela (mapa, HUD e painel) até a câmera voltar. */}
      {radarLocked && (
        <View
          style={StyleSheet.absoluteFill}
          onStartShouldSetResponder={() => true}
          accessibilityViewIsModal
          accessibilityLabel={t('radar.revealingA11y')}
        />
      )}

      <RefuelModal
        visible={refuelOpen}
        onClose={closeRefuel}
        fuel={energy}
        maxFuel={maxEnergy}
        balance={balance}
        price={fillTankPrice}
        connected={roomConnected}
        onPurchase={purchaseFuel}
      />

      {/* Pack de boas-vindas / diário: chega depois de andar ~10 m na sala (um por vez, na ordem de chegada). */}
      <CardsPackModal pack={visiblePack} onClose={dismissCardsPack} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  selfAvatar: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hudTop: {
    position: 'absolute',
    left: 16,
    right: 16,
    gap: 8,
  },
  hudRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
  },
  fuel: {
    flex: 1,
    justifyContent: 'center',
  },
  bottomHud: {
    position: 'absolute',
    left: 16,
    right: 16,
    gap: 8,
  },
});

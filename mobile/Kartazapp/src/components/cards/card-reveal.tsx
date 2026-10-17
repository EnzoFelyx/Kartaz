import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { CardArtwork } from '@/components/collection/card-artwork';
import { OvrBadge } from '@/components/collection/ovr-badge';
import { LayersIcon } from '@/components/icons/layers-icon';
import { SoccerBallIcon } from '@/components/icons/soccer-ball-icon';
import { SvgGradientRect } from '@/components/ui/svg-gradient-rect';
import type { SerialClass } from '@/lib/colyseus/types';
import type { Player } from '@/types/player-card';
import { colors, withAlpha } from '@/theme/colors';
import { serialClassStyles } from '@/theme/game-colors';
import { formatNumber } from '@/utils/card-labels';

import { useCardFlip } from './use-card-flip';

const BORDER_WIDTH = 2;
const CARD_RADIUS = 16;
const OUTER_RADIUS = CARD_RADIUS + BORDER_WIDTH;
/** Altura da carta em relação à largura (carta em pé). */
export const CARD_REVEAL_ASPECT = 1.4;
/** Parte da altura ocupada pela foto na frente. */
const ART_RATIO = 0.6;
const BACK_ICON_SIZE = 40;

export type CardRevealProps = {
  player: Player;
  serialNumber: number;
  serialMax: number;
  serialClass: SerialClass;
  /** Controlado por quem usa: vira a carta ao passar para `true`. */
  revealed: boolean;
  /** Toque na carta virada para baixo. */
  onReveal: () => void;
  /** Largura da carta (a altura sai da proporção `CARD_REVEAL_ASPECT`). */
  width: number;
};

/**
 * Carta virada para baixo que o jogador toca para revelar (packs, recompensas...).
 * Costas: contorno azul, selo da classe no canto, bola de futebol e "Toque para revelar", pulsando de leve.
 * Ao revelar, gira em 3D e mostra a frente: foto com overall, nome, time, série (nº / total) e o selo da classe.
 * A classe (`serialClass`) define a borda, o selo e o brilho: extreme dourada, elite roxa, padrão azul.
 */
export function CardReveal({
  player,
  serialNumber,
  serialMax,
  serialClass,
  revealed,
  onReveal,
  width,
}: CardRevealProps) {
  const { t } = useTranslation();
  const height = width * CARD_REVEAL_ASPECT;
  const serial = serialClassStyles[serialClass];
  // Padrão fica neutro nas costas (como no layout); elite/extreme já mostram a cor da classe.
  const backClassColor = serialClass === 'standard' ? colors.foreground : serial.badge;

  const { pulseStyle, backStyle, frontStyle, glowStyle } = useCardFlip(revealed, serial.glow);

  const accessibilityLabel = revealed
    ? t('cardReveal.revealedA11y', {
        name: player.name,
        serial: serialNumber,
        max: serialMax,
        serialClass: t(`cardReveal.serialClass.${serialClass}`),
      })
    : t('cardReveal.tapToReveal');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: revealed }}
      disabled={revealed}
      onPress={onReveal}>
      <Animated.View style={[{ width, height }, pulseStyle]}>
        {/* Brilho da classe (elite/extreme), atrás do palco; só acende com a frente já parada. */}
        {serial.glow > 0 && (
          <Animated.View style={[styles.glow, { shadowColor: serial.badge }, glowStyle]} pointerEvents="none" />
        )}

        {/* Palco 3D: as duas faces giram aqui dentro, sem outras camadas no mesmo plano. */}
        <View style={styles.stage} pointerEvents="none">
          {/* Costas */}
          <Animated.View style={[styles.face, styles.back, backStyle]} pointerEvents="none">
            <View style={[styles.backClass, { borderColor: withAlpha(backClassColor, 0.35) }]}>
              <LayersIcon color={backClassColor} size={12} />
              <Text style={[styles.classText, { color: backClassColor }]}>
                {t(`cardReveal.serialClass.${serialClass}`)}
              </Text>
            </View>
            <SoccerBallIcon color={colors.primarySoft} size={BACK_ICON_SIZE} />
            <Text style={styles.hintText}>{t('cardReveal.tapToReveal')}</Text>
          </Animated.View>

          {/* Frente */}
          <Animated.View style={[styles.face, frontStyle]} pointerEvents="none">
            <SvgGradientRect
              id="front"
              colors={serial.gradient}
              radius={OUTER_RADIUS}
              width={width}
              height={height}
              style={styles.border}
            />
            <View style={styles.inner}>
              <View style={{ height: (height - BORDER_WIDTH * 2) * ART_RATIO }}>
                <CardArtwork uri={player.imageUri} style={styles.art} pointerEvents="none" depth="flat" />
                <OvrBadge ovr={player.rating} style={styles.ratingBadge} />
                {player.flagEmoji && <Text style={styles.flag}>{player.flagEmoji}</Text>}
              </View>

              <View style={styles.meta}>
                <Text style={styles.name} numberOfLines={1}>
                  {player.name}
                </Text>
                {!!player.team && (
                  <Text style={styles.team} numberOfLines={1}>
                    {player.team}
                  </Text>
                )}
                <Text style={styles.serial}>
                  {t('cardReveal.serial', { serial: formatNumber(serialNumber), max: formatNumber(serialMax) })}
                </Text>
                <View style={[styles.classBadge, { borderColor: serial.badge }]}>
                  <Text style={[styles.classText, { color: serial.badge }]}>
                    {t(`cardReveal.serialClass.${serialClass}`)}
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Tudo em medidas fixas (faces, borda e miolo posicionados): com `padding` + `flex`, a frente
  // girada em 3D saía deslocada e cobria a borda da direita e de baixo.
  face: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: OUTER_RADIUS,
  },
  border: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  stage: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  glow: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: OUTER_RADIUS,
    backgroundColor: colors.card,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 18,
  },
  inner: {
    position: 'absolute',
    top: BORDER_WIDTH,
    right: BORDER_WIDTH,
    bottom: BORDER_WIDTH,
    left: BORDER_WIDTH,
    overflow: 'hidden',
    borderRadius: CARD_RADIUS,
    backgroundColor: colors.card,
  },
  back: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    borderWidth: 1.5,
    borderColor: withAlpha(colors.primarySoft, 0.7),
    backgroundColor: colors.card,
  },
  backClass: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: withAlpha(colors.white, 0.04),
  },
  hintText: {
    color: colors.primarySoft,
    fontSize: 13,
    fontWeight: '600',
  },
  art: {
    width: '100%',
    height: '100%',
  },
  ratingBadge: {
    position: 'absolute',
    left: 10,
    top: 10,
  },
  flag: {
    position: 'absolute',
    right: 8,
    bottom: 2,
    fontSize: 26,
  },
  meta: {
    flex: 1,
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 14,
  },
  name: {
    color: colors.foreground,
    fontSize: 17,
    fontWeight: '800',
  },
  team: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  serial: {
    marginTop: 4,
    color: colors.secondaryForeground,
    fontSize: 12,
    fontWeight: '600',
  },
  classBadge: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: withAlpha(colors.deep, 0.5),
  },
  classText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});

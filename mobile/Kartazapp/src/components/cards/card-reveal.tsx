import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { CardArtwork } from '@/components/collection/card-artwork';
import { LayersIcon } from '@/components/icons/layers-icon';
import { SoccerBallIcon } from '@/components/icons/soccer-ball-icon';
import type { SerialClass } from '@/lib/colyseus/types';
import type { Player } from '@/types/player-card';
import { colors, withAlpha } from '@/theme/colors';
import { formatNumber } from '@/utils/card-labels';

const BORDER_WIDTH = 2;
const CARD_RADIUS = 16;
const OUTER_RADIUS = CARD_RADIUS + BORDER_WIDTH;
/** Altura da carta em relação à largura (carta em pé). */
export const CARD_REVEAL_ASPECT = 1.4;
/** Parte da altura ocupada pela foto na frente. */
const ART_RATIO = 0.6;
const BACK_ICON_SIZE = 40;
const FLIP_MS = 680;
const GLOW_IN_MS = 300;

/** Estilo de cada classe de série: gradiente da borda, cor do selo e brilho em volta ao revelar. */
const SERIAL_STYLE: Record<SerialClass, { gradient: [string, string]; badge: string; glow: number }> = {
  extreme: { gradient: [colors.fuelEnd, colors.gold], badge: colors.gold, glow: 0.7 },
  elite: { gradient: [colors.violet, colors.magenta], badge: colors.magenta, glow: 0.55 },
  standard: { gradient: [colors.primary, colors.progressEnd], badge: colors.fuelEnd, glow: 0 },
};

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
  const serial = SERIAL_STYLE[serialClass];
  // Padrão fica neutro nas costas (como no layout); elite/extreme já mostram a cor da classe.
  const backClassColor = serialClass === 'standard' ? colors.foreground : serial.badge;

  const rotation = useSharedValue(revealed ? 180 : 0);
  const pulse = useSharedValue(1);
  /** Brilho da classe: só acende depois que o giro termina (0 → 1). */
  const glow = useSharedValue(revealed ? 1 : 0);

  useEffect(() => {
    rotation.set(revealed ? withTiming(180, { duration: FLIP_MS, easing: Easing.inOut(Easing.cubic) }) : 0);
    glow.set(revealed ? withDelay(FLIP_MS, withTiming(1, { duration: GLOW_IN_MS })) : 0);
  }, [revealed, rotation, glow]);

  useEffect(() => {
    if (revealed) {
      cancelAnimation(pulse);
      pulse.set(withTiming(1, { duration: 150 }));
      return;
    }
    const easing = Easing.inOut(Easing.quad);
    pulse.set(
      withRepeat(
        withSequence(withTiming(1.025, { duration: 900, easing }), withTiming(1, { duration: 900, easing })),
        -1,
      ),
    );
    return () => cancelAnimation(pulse);
  }, [revealed, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  /*
   * Cada face gira sozinha (0–180 = progresso do giro): as costas vão de 0° a 90° e somem; a frente
   * entra de -90° e termina em 0°, sem rotação.
   * A foto da frente é `flat` (sem a sombra em bitmap das listas): sombra em volta da foto, com
   * opacidade/3D animados, apagava a foto no iOS.
   * As faces ficam num palco só delas e o brilho fica fora, aceso só depois do giro: no iOS a face
   * girada é ordenada em profundidade com as vizinhas, e a metade "de trás" sumia atrás do brilho
   * escuro (metade da carta preta).
   */
  const backStyle = useAnimatedStyle(() => ({
    opacity: rotation.value < 90 ? 1 : 0,
    transform: [{ perspective: 1400 }, { rotateY: `${Math.min(rotation.value, 90)}deg` }],
  }));
  const frontStyle = useAnimatedStyle(() => ({
    opacity: rotation.value < 90 ? 0 : 1,
    transform: [{ perspective: 1400 }, { rotateY: `${Math.max(rotation.value - 180, -90)}deg` }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value > 0 ? 1 : 0,
    shadowOpacity: serial.glow * glow.value,
  }));

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
            <BorderGradient id="front" colors={serial.gradient} width={width} height={height} />
            <View style={styles.inner}>
              <View style={{ height: (height - BORDER_WIDTH * 2) * ART_RATIO }}>
                <CardArtwork uri={player.imageUri} style={styles.art} pointerEvents="none" depth="flat" />
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingText}>{player.rating > 0 ? player.rating : '—'}</Text>
                </View>
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

/** Borda em gradiente diagonal: fundo da face no tamanho exato da carta, com o miolo por cima. */
type BorderGradientProps = { id: string; colors: [string, string]; width: number; height: number };

function BorderGradient({ id, colors: [start, end], width, height }: BorderGradientProps) {
  return (
    <Svg style={styles.border} width={width} height={height}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={start} />
          <Stop offset="1" stopColor={end} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} rx={OUTER_RADIUS} fill={`url(#${id})`} />
    </Svg>
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
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.glass,
  },
  ratingText: {
    color: colors.foreground,
    fontSize: 15,
    fontWeight: '800',
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

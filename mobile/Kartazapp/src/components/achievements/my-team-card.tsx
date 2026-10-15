import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { CardArtwork } from '@/components/collection/card-artwork';
import { ChevronRightIcon } from '@/components/icons/chevron-right-icon';
import { ShieldIcon } from '@/components/icons/shield-icon';
import { playerPhotoUri, resolveApiUri } from '@/lib/api/image-uri';
import type { UserTeamDto } from '@/lib/api/team-api';
import { colors, withAlpha } from '@/theme/colors';

const THUMB_SIZE = 60;

type MyTeamCardProps = {
  /** `null` = o jogador ainda não tem time; `undefined` = carregando. */
  team: UserTeamDto | null | undefined;
  onPress: () => void;
};

/**
 * Card "Meu time" no topo das Conquistas: escudo (ou o melhor titular), nome, overall do time e
 * vitórias/derrotas. Leva à edição do time (nome e titulares).
 */
export function MyTeamCard({ team, onPress }: MyTeamCardProps) {
  const { t } = useTranslation();
  const loading = team === undefined;
  const record = team ? t('achievements.record', { wins: team.wins, losses: team.losses }) : '';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        team
          ? t('achievements.myTeamA11y', { name: team.name, overall: team.overall, record })
          : t('achievements.myTeam')
      }
      disabled={!team}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.row}>
        <View style={styles.thumb}>
          {loading ? <ActivityIndicator color={colors.primary} /> : <TeamThumb team={team} />}
        </View>

        <View style={styles.texts}>
          <Text style={styles.label}>{t('achievements.myTeam').toUpperCase()}</Text>
          <Text style={styles.name} numberOfLines={1}>
            {team ? team.name : loading ? ' ' : t('achievements.noTeam')}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {team ? `OVR ${team.overall} · ${record}` : loading ? ' ' : t('achievements.noTeamHint')}
          </Text>
        </View>

        {team && <ChevronRightIcon color={colors.secondaryForeground} size={20} />}
      </View>

      {team && <Text style={styles.edit}>{t('achievements.editTeam')}</Text>}
    </Pressable>
  );
}

/** Escudo do time; sem escudo, a foto do titular de maior overall; sem titulares, o ícone de escudo. */
function TeamThumb({ team }: { team: UserTeamDto | null }) {
  const shieldUri = resolveApiUri(team?.shieldUrl);
  if (shieldUri) return <Image source={{ uri: shieldUri }} style={styles.fill} contentFit="contain" />;

  const best = team?.slots.map((slot) => slot.instance).sort((a, b) => (b.card.ovr ?? 0) - (a.card.ovr ?? 0))[0];
  if (best) {
    return <CardArtwork uri={playerPhotoUri(best.card.id, best.card.url)} style={styles.fill} pointerEvents="none" />;
  }
  return <ShieldIcon color={withAlpha(colors.primary, 0.6)} size={26} />;
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 16,
    backgroundColor: withAlpha(colors.primary, 0.12),
    borderWidth: 1,
    borderColor: withAlpha(colors.primary, 0.2),
  },
  fill: {
    width: '100%',
    height: '100%',
  },
  texts: {
    flex: 1,
    gap: 3,
  },
  label: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  name: {
    color: colors.foreground,
    fontSize: 18,
    fontWeight: '800',
  },
  meta: {
    color: colors.secondaryForeground,
    fontSize: 13,
    fontWeight: '600',
  },
  edit: {
    color: colors.mutedForeground,
    fontSize: 12,
  },
});

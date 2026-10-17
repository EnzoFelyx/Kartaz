import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { HelpCircleIcon } from '@/components/icons/help-circle-icon';
import { IconButton } from '@/components/ui/icon-button';
import type { TeamScore } from '@/lib/team/team-scoring';
import { colors } from '@/theme/colors';
import { formatNumber } from '@/utils/card-labels';
import { listItemEntering } from '@/utils/list-loading';

type TeamOverallCardProps = {
  score: TeamScore;
  /** Abre as regras do bônus (o "?"). */
  onOpenRules: () => void;
  /** Posição na entrada em sequência da tela. */
  enteringIndex: number;
};

/** Overall do time: soma dos titulares, bônus total e a divisão seleção/clube, com o "?" das regras. */
export function TeamOverallCard({ score, onOpenRules, enteringIndex }: TeamOverallCardProps) {
  const { t } = useTranslation();
  return (
    <Animated.View entering={listItemEntering(enteringIndex)} style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.overall}>{t('team.overall', { overall: score.overall })}</Text>
        <IconButton
          icon={<HelpCircleIcon color={colors.primary} size={22} />}
          accessibilityLabel={t('team.rulesTitle')}
          onPress={onOpenRules}
        />
      </View>
      <Text style={styles.base}>
        {t('team.baseBonus', { base: score.baseSum, bonus: formatNumber(score.bonusPercent) })}
      </Text>
      <Text style={styles.split}>
        {t('team.bonusSplit', {
          nation: formatNumber(score.nationBonusPercent),
          club: formatNumber(score.clubBonusPercent),
        })}
      </Text>
      <Text style={styles.group}>{t('team.maxGroups', { nation: score.maxSameNation, club: score.maxSameClub })}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 4,
    padding: 18,
    borderRadius: 20,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  overall: {
    color: colors.primary,
    fontSize: 26,
    fontWeight: '900',
  },
  base: {
    color: colors.secondaryForeground,
    fontSize: 14,
  },
  split: {
    color: colors.violet,
    fontSize: 13,
    fontWeight: '700',
  },
  group: {
    color: colors.mutedForeground,
    fontSize: 12,
  },
});

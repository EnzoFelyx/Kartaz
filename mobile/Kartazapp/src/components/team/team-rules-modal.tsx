import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { CLUB_BONUS_TABLE, NATION_BONUS_TABLE, type BonusTier } from '@/lib/team/team-scoring';
import { colors, withAlpha } from '@/theme/colors';
import { formatNumber } from '@/utils/card-labels';

type TeamRulesModalProps = {
  visible: boolean;
  onClose: () => void;
};

/** Regras da pontuação do time (aberto pelo "?" ao lado do overall): base + bônus cumulativo por seleção e por clube. */
export function TeamRulesModal({ visible, onClose }: TeamRulesModalProps) {
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(event) => event.stopPropagation()} accessibilityViewIsModal>
          <Text style={styles.title} accessibilityRole="header">
            {t('team.rulesTitle')}
          </Text>
          <Text style={styles.text}>{t('team.rulesBase')}</Text>
          <Text style={styles.text}>{t('team.rulesBonus')}</Text>

          <BonusTable title={t('team.rulesNationTitle')} tiers={NATION_BONUS_TABLE} label="team.rulesTier" />
          <BonusTable title={t('team.rulesClubTitle')} tiers={CLUB_BONUS_TABLE} label="team.rulesClubTier" />

          <Text style={styles.example}>{t('team.rulesCap')}</Text>
          <Text style={styles.example}>{t('team.rulesExample')}</Text>

          <Pressable accessibilityRole="button" onPress={onClose} hitSlop={8} style={styles.closeButton}>
            <Text style={styles.closeText}>{t('common.close')}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function BonusTable({
  title,
  tiers,
  label,
}: {
  title: string;
  tiers: readonly BonusTier[];
  label: 'team.rulesTier' | 'team.rulesClubTier';
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.tableBlock}>
      <Text style={styles.tableTitle}>{title}</Text>
      <View style={styles.table}>
        {tiers.map((tier) => (
          <View key={tier.count} style={styles.tier}>
            <Text style={styles.tierLabel}>{t(label, { count: tier.count })}</Text>
            <Text style={styles.tierValue}>+{formatNumber(tier.percent)}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: withAlpha(colors.deep, 0.7),
  },
  card: {
    width: '100%',
    maxWidth: 380,
    gap: 12,
    padding: 22,
    borderRadius: 22,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: withAlpha(colors.primary, 0.25),
  },
  title: {
    color: colors.foreground,
    fontSize: 20,
    fontWeight: '800',
  },
  text: {
    color: colors.secondaryForeground,
    fontSize: 14,
    lineHeight: 20,
  },
  tableBlock: {
    gap: 6,
  },
  tableTitle: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: '800',
  },
  table: {
    overflow: 'hidden',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tier: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tierLabel: {
    color: colors.foreground,
    fontSize: 14,
  },
  tierValue: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  example: {
    color: colors.mutedForeground,
    fontSize: 13,
    lineHeight: 18,
  },
  closeButton: {
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  closeText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
});

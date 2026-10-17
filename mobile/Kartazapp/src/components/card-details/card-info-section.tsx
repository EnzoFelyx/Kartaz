import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import type { Player, PlayerCard } from '@/types/player-card';
import { colors } from '@/theme/colors';
import { formatShortDate, getPositionName } from '@/utils/card-labels';

type CardInfoSectionProps = {
  card: Player;
  /** Cópia do usuário (serial e data de coleta), quando ele tem uma. */
  owned: PlayerCard | null;
};

/** "Informações da carta": posição e, quando o usuário tem uma cópia, serial e data de coleta. */
export function CardInfoSection({ card, owned }: CardInfoSectionProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.infoCard}>
      {owned && <InfoRow label={t('cardDetails.serial')} value={`#${owned.serial} / ${owned.maxSerial}`} />}
      <InfoRow label={t('cardDetails.position')} value={getPositionName(card.position)} last={!owned} />
      {owned && <InfoRow label={t('cardDetails.collected')} value={formatShortDate(owned.collectedAt)} last />}
    </View>
  );
}

function InfoRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.infoRow, !last && styles.infoDivider]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  infoCard: {
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  infoDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    color: colors.mutedForeground,
    fontSize: 14,
    fontWeight: '600',
  },
  infoValue: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: '700',
  },
});

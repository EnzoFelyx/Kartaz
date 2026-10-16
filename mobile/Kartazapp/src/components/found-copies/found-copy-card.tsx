import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CalendarIcon } from '@/components/icons/calendar-icon';
import { MapPinIcon } from '@/components/icons/map-pin-icon';
import { MessageCircleIcon } from '@/components/icons/message-circle-icon';
import { SwapIcon } from '@/components/icons/swap-icon';
import { UserIcon } from '@/components/icons/user-icon';
import type { FoundCopy } from '@/types/player-card';
import { colors } from '@/theme/colors';
import { formatLocation, formatShortDate } from '@/utils/card-labels';

const ROW_ICON_SIZE = 16;

type FoundCopyCardProps = {
  copy: FoundCopy;
  /** Proposta de troca por esta cópia; sem ela (cópia do próprio usuário) o botão não aparece. */
  onMakeOffer?: () => void;
};

type InfoRowProps = {
  icon: ReactNode;
  label: string;
  value: string;
};

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>{icon}</View>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

/** Uma cópia encontrada: serial no topo, dados da coleta e botão de proposta de troca. */
export function FoundCopyCard({ copy, onMakeOffer }: FoundCopyCardProps) {
  const { t } = useTranslation();
  const iconColor = colors.mutedForeground;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.serial}>
          {copy.serial} / {copy.maxSerial}
        </Text>
      </View>

      <View style={styles.body}>
        <InfoRow
          icon={<UserIcon color={iconColor} size={ROW_ICON_SIZE} />}
          label={t('foundCopies.owner')}
          value={copy.owner}
        />
        <InfoRow
          icon={<CalendarIcon color={iconColor} size={ROW_ICON_SIZE} />}
          label={t('foundCopies.foundAt')}
          value={formatShortDate(copy.foundAt)}
        />
        <InfoRow
          icon={<MapPinIcon color={iconColor} size={ROW_ICON_SIZE} />}
          label={t('foundCopies.foundWhere')}
          value={formatLocation(copy.foundLocation)}
        />
        <InfoRow
          icon={<MessageCircleIcon color={iconColor} size={ROW_ICON_SIZE} />}
          label={t('foundCopies.offers')}
          value={String(copy.tradeOffers)}
        />

        {onMakeOffer && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('foundCopies.makeOfferA11y', { serial: copy.serial, total: copy.maxSerial })}
            onPress={onMakeOffer}
            style={({ pressed }) => [styles.offerButton, pressed && styles.pressed]}>
            <SwapIcon color={colors.foreground} size={18} />
            <Text style={styles.offerText}>{t('foundCopies.makeOffer')}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: colors.secondary,
  },
  serial: {
    color: colors.foreground,
    fontSize: 20,
    fontWeight: '800',
  },
  body: {
    gap: 14,
    padding: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowIcon: {
    width: ROW_ICON_SIZE,
    alignItems: 'center',
  },
  rowLabel: {
    width: 110,
    color: colors.mutedForeground,
    fontSize: 14,
  },
  rowValue: {
    flex: 1,
    color: colors.foreground,
    fontSize: 15,
    fontWeight: '700',
  },
  offerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: colors.primary,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  offerText: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '800',
  },
});

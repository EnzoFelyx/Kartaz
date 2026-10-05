import { useTranslation } from 'react-i18next';

import { ScreenPlaceholder } from '@/components/screen-placeholder';

export default function TradesScreen() {
  const { t } = useTranslation();
  return (
    <ScreenPlaceholder title={t('placeholders.tradesTitle')} subtitle={t('placeholders.tradesSubtitle')} />
  );
}

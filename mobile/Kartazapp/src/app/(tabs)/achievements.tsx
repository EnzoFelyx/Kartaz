import { useTranslation } from 'react-i18next';

import { ScreenPlaceholder } from '@/components/screen-placeholder';

export default function AchievementsScreen() {
  const { t } = useTranslation();
  return (
    <ScreenPlaceholder title={t('placeholders.achievementsTitle')} subtitle={t('placeholders.achievementsSubtitle')} />
  );
}

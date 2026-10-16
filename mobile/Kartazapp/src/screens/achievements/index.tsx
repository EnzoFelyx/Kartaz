import { useAchievementsViewModel } from './use-view-model';
import { AchievementsView } from './view';

/**
 * Conquistas: card "Meu time" (leva à edição do time), resumo (vitórias, conquistas do time e
 * individuais) e as listas de conquistas.
 */
export default function AchievementsScreen() {
  const viewModel = useAchievementsViewModel();
  return <AchievementsView {...viewModel} />;
}

import { useSocialAuthButtonsViewModel, type SocialAuthButtonsProps } from './use-view-model';
import { SocialAuthButtonsView } from './view';

/** Botões "Continuar com Apple" (só iOS) e "Continuar com Google", que vinculam a conta. */
export function SocialAuthButtons(props: SocialAuthButtonsProps) {
  const viewModel = useSocialAuthButtonsViewModel(props);
  return <SocialAuthButtonsView {...viewModel} />;
}

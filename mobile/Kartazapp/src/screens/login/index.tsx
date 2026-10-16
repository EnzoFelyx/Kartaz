import { useLoginViewModel } from './use-view-model';
import { LoginView } from './view';

/**
 * Onboarding + entrada: 3 telas de apresentação (swipe, "Próximo" ou "Pular") e a tela de boas-vindas
 * com os botões de entrada. Depois de vista uma vez, abre direto na boas-vindas.
 */
export default function LoginScreen() {
  const viewModel = useLoginViewModel();
  return <LoginView {...viewModel} />;
}

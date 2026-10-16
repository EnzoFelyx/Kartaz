import { useProfileViewModel } from './use-view-model';
import { ProfileView } from './view';

/** Perfil: header, card do jogador e estatísticas (dados do backend via GET /user). */
export default function ProfileScreen() {
  const viewModel = useProfileViewModel();
  return <ProfileView {...viewModel} />;
}

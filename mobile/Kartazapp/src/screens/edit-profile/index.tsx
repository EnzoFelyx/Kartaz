import { useEditProfileViewModel } from './use-view-model';
import { EditProfileView } from './view';

/** Editar Perfil: troca de foto e campos de nome, email e bio. */
export default function EditProfileScreen() {
  const viewModel = useEditProfileViewModel();
  return <EditProfileView {...viewModel} />;
}

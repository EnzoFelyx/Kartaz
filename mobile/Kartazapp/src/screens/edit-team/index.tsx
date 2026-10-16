import type { UserTeamDto } from '@/lib/api/team-api';

import { useEditTeamScreenViewModel, useEditTeamViewModel } from './use-view-model';
import { EditTeamEmptyView, EditTeamView } from './view';

/** Edição do time: nome, os 5 titulares (com troca) e o overall recalculado na hora. */
export default function EditTeamScreen() {
  const { team, loading, goBack } = useEditTeamScreenViewModel();
  if (!team) return <EditTeamEmptyView loading={loading} onBack={goBack} />;
  // Remonta se o time mudar (ex.: salvo em outro aparelho): o rascunho começa do servidor.
  return <TeamEditor key={team.id} team={team} onDone={goBack} />;
}

function TeamEditor({ team, onDone }: { team: UserTeamDto; onDone: () => void }) {
  const viewModel = useEditTeamViewModel(team, onDone);
  return <EditTeamView {...viewModel} />;
}

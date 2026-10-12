import * as SecureStore from 'expo-secure-store';

const ONBOARDING_KEY = 'kartaz_onboarding_seen';

/** TODO: temporário — mostra o onboarding a cada abertura. Voltar para `false` antes de lançar. */
const ALWAYS_SHOW_ONBOARDING = true;

/** Se o usuário já passou pelas telas de apresentação neste aparelho. */
export async function getOnboardingSeen() {
  if (ALWAYS_SHOW_ONBOARDING) return false;
  return (await SecureStore.getItemAsync(ONBOARDING_KEY)) === 'true';
}

export async function setOnboardingSeen() {
  await SecureStore.setItemAsync(ONBOARDING_KEY, 'true');
  return true;
}

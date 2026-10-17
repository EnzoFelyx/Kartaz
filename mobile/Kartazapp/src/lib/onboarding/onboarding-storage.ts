import * as SecureStore from 'expo-secure-store';

import { storageKeys } from '@/lib/storage/keys';

/** Se o usuário já passou pelas telas de apresentação neste aparelho. */
export async function getOnboardingSeen() {
  return (await SecureStore.getItemAsync(storageKeys.onboardingSeen)) === 'true';
}

export async function setOnboardingSeen() {
  await SecureStore.setItemAsync(storageKeys.onboardingSeen, 'true');
  return true;
}

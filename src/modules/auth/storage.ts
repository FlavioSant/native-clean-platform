import * as SecureStore from 'expo-secure-store';

import { REFRESH_TOKEN_STORAGE_KEY } from './constants';

/**
 * iOS only, and only on the write: `kSecAttrAccessible` is an attribute of the
 * stored item, so repeating it on the read or the delete would be inert.
 *
 * The default — `WHEN_UNLOCKED` — is migrated to a new device when restoring
 * from an encrypted backup. A refresh token is a bearer credential valid for
 * weeks, so it must not outlive the device it was issued to. Android's keystore
 * keys are already device-bound, which is why there is no counterpart there.
 */
const REFRESH_TOKEN_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

/**
 * The native implementation: the iOS keychain and the Android keystore. The web
 * build resolves `storage.web.ts` instead — Metro picks the platform suffix.
 */
export const readRefreshToken = async (): Promise<string | null> =>
  SecureStore.getItemAsync(REFRESH_TOKEN_STORAGE_KEY);

export const writeRefreshToken = async (token: string): Promise<void> =>
  SecureStore.setItemAsync(REFRESH_TOKEN_STORAGE_KEY, token, REFRESH_TOKEN_OPTIONS);

export const clearRefreshToken = async (): Promise<void> =>
  SecureStore.deleteItemAsync(REFRESH_TOKEN_STORAGE_KEY);

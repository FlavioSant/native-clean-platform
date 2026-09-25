import * as SecureStore from 'expo-secure-store';

import { REFRESH_TOKEN_STORAGE_KEY } from './constants';
import { clearRefreshToken, readRefreshToken, writeRefreshToken } from './storage';

const TOKEN = 'stored-refresh-token';

beforeEach(async () => {
  await clearRefreshToken();
  jest.clearAllMocks();
});

describe('refresh token storage', () => {
  it('reads null when nothing was stored', async () => {
    await expect(readRefreshToken()).resolves.toBeNull();
  });

  it('reads back what it wrote', async () => {
    await writeRefreshToken(TOKEN);

    await expect(readRefreshToken()).resolves.toBe(TOKEN);
  });

  it('reads null after clearing', async () => {
    await writeRefreshToken(TOKEN);
    await clearRefreshToken();

    await expect(readRefreshToken()).resolves.toBeNull();
  });

  it('pins the entry to this device, so a backup restore cannot carry it to another', async () => {
    await writeRefreshToken(TOKEN);

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(REFRESH_TOKEN_STORAGE_KEY, TOKEN, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  });
});

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  readThemePreference,
  THEME_PREFERENCES,
  writeThemePreference,
} from './themePreferenceStorage';

const STORAGE_KEY = 'theme.preference';

beforeEach(async () => {
  await AsyncStorage.removeItem(STORAGE_KEY);
});

describe('theme preference storage', () => {
  it('reads null when nothing was stored', async () => {
    await expect(readThemePreference()).resolves.toBeNull();
  });

  it('reads back what it wrote', async () => {
    await writeThemePreference(THEME_PREFERENCES.DARK);

    await expect(readThemePreference()).resolves.toBe(THEME_PREFERENCES.DARK);
  });

  it('reads null for a stored value that is not one of the three preferences', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, 'sepia');

    await expect(readThemePreference()).resolves.toBeNull();
  });
});

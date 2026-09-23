import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { colorScheme } from 'nativewind';

import { readThemePreference, THEME_PREFERENCES } from './themePreferenceStorage';
import { useThemePreference } from './useThemePreference';

const STORAGE_KEY = 'theme.preference';

/** Every test starts from a known stored value — none relies on storage being empty. */
const seedStoredPreference = async () => {
  const setup = await renderHook(() => useThemePreference());

  await act(async () => {
    setup.result.current.setPreference(THEME_PREFERENCES.LIGHT);
  });
  setup.unmount();
};

beforeEach(async () => {
  await seedStoredPreference();
  colorScheme.set('system');
});

describe('useThemePreference', () => {
  it('stays on system when nothing has ever been stored', async () => {
    // The one test that reaches into AsyncStorage directly, to get a state
    // `seedStoredPreference` above deliberately never produces — same
    // narrow exception `themePreferenceStorage.test.ts` already takes.
    await AsyncStorage.removeItem(STORAGE_KEY);

    const { result } = await renderHook(() => useThemePreference());

    expect(result.current.preference).toBe(THEME_PREFERENCES.SYSTEM);
  });

  it('hydrates the stored preference on mount', async () => {
    const { result } = await renderHook(() => useThemePreference());

    await waitFor(() => {
      expect(result.current.preference).toBe(THEME_PREFERENCES.LIGHT);
    });
  });

  it('applies a manual choice immediately, through NativeWind', async () => {
    const { result } = await renderHook(() => useThemePreference());

    await act(async () => {
      result.current.setPreference(THEME_PREFERENCES.DARK);
    });

    expect(result.current.preference).toBe(THEME_PREFERENCES.DARK);
    expect(colorScheme.get()).toBe('dark');
  });

  it('persists a manual choice for the next mount', async () => {
    const first = await renderHook(() => useThemePreference());

    await act(async () => {
      first.result.current.setPreference(THEME_PREFERENCES.DARK);
    });
    first.unmount();

    await waitFor(async () => {
      await expect(readThemePreference()).resolves.toBe(THEME_PREFERENCES.DARK);
    });
  });
});

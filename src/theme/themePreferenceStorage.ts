import AsyncStorage from '@react-native-async-storage/async-storage';

export const THEME_PREFERENCES = { SYSTEM: 'system', LIGHT: 'light', DARK: 'dark' } as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[keyof typeof THEME_PREFERENCES];

/** Namespaced like `REFRESH_TOKEN_STORAGE_KEY`, so a second preference cannot collide. */
const THEME_PREFERENCE_STORAGE_KEY = 'theme.preference';

const isThemePreference = (value: string): value is ThemePreference =>
  (Object.values(THEME_PREFERENCES) as string[]).includes(value);

/** `null` covers both "nothing stored" and a value this app version no longer recognises. */
export const readThemePreference = async (): Promise<ThemePreference | null> => {
  const stored = await AsyncStorage.getItem(THEME_PREFERENCE_STORAGE_KEY);

  return stored !== null && isThemePreference(stored) ? stored : null;
};

export const writeThemePreference = async (preference: ThemePreference): Promise<void> => {
  await AsyncStorage.setItem(THEME_PREFERENCE_STORAGE_KEY, preference);
};

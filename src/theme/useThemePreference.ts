import { colorScheme } from 'nativewind';
import { useCallback, useEffect, useState } from 'react';

import {
  readThemePreference,
  THEME_PREFERENCES,
  type ThemePreference,
  writeThemePreference,
} from './themePreferenceStorage';

export interface ThemePreferenceValue {
  preference: ThemePreference;
  setPreference: (next: ThemePreference) => void;
}

/**
 * The one thing NativeWind's own `colorScheme` does not expose (D2/D3 in
 * docs/superpowers/specs/2026-09-22-dark-mode-design.md): which of
 * 'system' | 'light' | 'dark' the user actually chose, as opposed to what it
 * resolves to. Every caller hydrates independently from storage and applies
 * what it reads — safe because storage is the one source every mount
 * converges on, and only a user action (never two mounts at once) writes to it.
 */
export const useThemePreference = (): ThemePreferenceValue => {
  const [preference, setPreferenceState] = useState<ThemePreference>(THEME_PREFERENCES.SYSTEM);

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      const stored = await readThemePreference();

      if (!isMounted || stored === null) {
        return;
      }

      setPreferenceState(stored);
      colorScheme.set(stored);
    };

    hydrate();

    return () => {
      isMounted = false;
    };
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    colorScheme.set(next);
    writeThemePreference(next);
  }, []);

  return { preference, setPreference };
};

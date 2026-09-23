import { vars } from 'nativewind';
import type { PropsWithChildren } from 'react';
import { View } from 'react-native';

import { useThemeColors } from './useThemeColors';
import { useThemePreference } from './useThemePreference';

const CSS_VARIABLE_PREFIX = '--color-';

/**
 * Applies the active theme to the whole app via NativeWind's `vars()` (D1 in
 * docs/superpowers/specs/2026-09-22-dark-mode-design.md), and triggers
 * `useThemePreference`'s boot-time hydrate-and-apply effect (D3) — this
 * component itself never reads that hook's return value.
 */
export const ThemeProvider = ({ children }: PropsWithChildren) => {
  useThemePreference();
  const activeColors = useThemeColors();
  const cssVariables = vars(
    Object.fromEntries(
      Object.entries(activeColors).map(([key, value]) => [`${CSS_VARIABLE_PREFIX}${key}`, value]),
    ),
  );

  return (
    <View className="flex-1" style={cssVariables}>
      {children}
    </View>
  );
};

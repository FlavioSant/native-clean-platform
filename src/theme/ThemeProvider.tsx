import { vars } from 'nativewind';
import type { PropsWithChildren } from 'react';
import { View } from 'react-native';

import { useThemeColors } from './useThemeColors';
import { useThemePreference } from './useThemePreference';

const CSS_VARIABLE_PREFIX = '--color-';

/**
 * Applies the active theme to the whole app via NativeWind's `vars()`, and
 * triggers `useThemePreference`'s boot-time hydrate-and-apply effect — this
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

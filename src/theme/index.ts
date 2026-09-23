/** Inferred from `tokens.js` itself, so a scale key that does not exist is a compile error. */
export type Tokens = typeof import('./tokens');
export { ThemeProvider } from './ThemeProvider';
export { THEME_PREFERENCES, type ThemePreference } from './themePreferenceStorage';
export { colors, radius, semanticColors, spacing, typography } from './tokens';
export { useThemeColors } from './useThemeColors';
export { useThemePreference } from './useThemePreference';

/**
 * Converts a CSS token (`'16px'`) into the plain number that native React Native
 * APIs expect (`StyleSheet`, props of libraries that bypass NativeWind).
 */
export const parsePixels = (value: string): number => Number.parseFloat(value);

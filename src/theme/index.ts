/** Inferred from `tokens.js` itself, so a scale key that does not exist is a compile error. */
export type Tokens = typeof import('./tokens');
export { colors, radius, semanticColors, spacing, typography } from './tokens';

/**
 * Converts a CSS token (`'16px'`) into the plain number that native React Native
 * APIs expect (`StyleSheet`, props of libraries that bypass NativeWind).
 */
export const parsePixels = (value: string): number => Number.parseFloat(value);

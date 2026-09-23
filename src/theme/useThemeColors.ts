import { useColorScheme } from 'nativewind';

import { semanticColors, semanticColorsDark } from './tokens';

const DARK_SCHEME = 'dark';

/**
 * The semantic colour map for whichever theme is active right now — for the
 * rare call site that needs a literal value instead of a Tailwind class (an
 * `ActivityIndicator`'s `color` prop, for example). Screens use the classes
 * themselves; see `src/theme/README.md`.
 */
export const useThemeColors = (): typeof semanticColors => {
  const { colorScheme } = useColorScheme();

  return colorScheme === DARK_SCHEME ? semanticColorsDark : semanticColors;
};

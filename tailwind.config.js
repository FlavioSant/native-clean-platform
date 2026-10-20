const { colors, semanticColors, spacing, typography, radius } = require('./src/theme/tokens');

/** Strips null entries (e.g. system fontFamily) before handing them to Tailwind. */
const compact = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([, value]) => value != null));

/**
 * Every semantic alias becomes a CSS variable reference instead of a literal
 * value: `ThemeProvider` (`src/theme/ThemeProvider.tsx`) supplies the actual
 * light/dark value at runtime via NativeWind's `vars()`.
 */
const themeColorVars = Object.fromEntries(
  Object.keys(semanticColors).map((key) => [key, `var(--color-${key})`]),
);

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ...colors,
        ...themeColorVars,
      },
      spacing,
      borderRadius: radius,
      fontFamily: compact(typography.fontFamily),
      fontSize: typography.fontSize,
      fontWeight: typography.fontWeight,
    },
  },
  plugins: [],
};

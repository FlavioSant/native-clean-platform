# Theme

Design tokens for the whole app, plus the dark mode mechanism. `tokens.js`
is the single source of truth and is deliberately CommonJS: the same file
feeds `tailwind.config.js` (Node) and the TypeScript code, so a token
never diverges between the two.

There is no hand-written `.d.ts`: TypeScript infers the types from
`tokens.js` itself (`allowJs`), so a scale step that does not exist —
`colors.brand[5000]`, `colors.success[100]` — is a compile error, and a
hand-written type has no way of going stale relative to the file.
`index.ts` re-exports it for app code.

## Components

| Name | Description |
| ---- | ------------- |
| `ThemeProvider` | Applies the active theme across the whole app via NativeWind's `vars()` on a root `View`, and fires `useThemePreference`'s boot effect. Mounted in `App.tsx`, inside the `GestureHandlerRootView`. |

## Hooks

| Name | Description |
| ---- | ------------- |
| `useThemeColors()` | The active semantic map (`semanticColors` or `semanticColorsDark`), for the rare case that needs a literal value outside NativeWind — an `ActivityIndicator` colour, for example. |
| `useThemePreference()` | `{ preference, setPreference }`. `preference` is `'system' \| 'light' \| 'dark'` — the user's choice, not the resolved value (NativeWind's `colorScheme` only returns the resolved one). Hydrates from `AsyncStorage` on mount and applies via `colorScheme.set()`; `setPreference` saves and applies in the same call. |

## Constants

| Name             | Description                                                          |
| ---------------- | ---------------------------------------------------------------------- |
| `colors`         | Raw scales: `brand` and `neutral` (50→950), plus `success`, `warning`, `danger`, `info`. |
| `semanticColors` | Role-based aliases in the light theme: `background`, `surface`, `content`, `primary`, `border`, `danger`, … |
| `THEME_PREFERENCES` | `system` \| `light` \| `dark` — the three values of `useThemePreference().preference`. |
| `spacing`        | 4pt grid, as CSS strings.                                              |
| `typography`     | `fontFamily`, `fontSize` (with line heights), `fontWeight`.            |
| `radius`         | Border radius scale.                                                   |

## Functions

| Name              | Description                                                        |
| ----------------- | ------------------------------------------------------------------ |
| `parsePixels(value)` | Converts a CSS token (`'16px'`) to the number native APIs expect (`16`). |

## Types

| Name     | Description                        |
| -------- | ------------------------------------ |
| `Tokens` | Shape of the whole tokens object, inferred from `tokens.js`. |
| `ThemePreference` | Union derived from `THEME_PREFERENCES`. |

## Adapting to a new app

1. Replace the `colors.brand` scale.
2. Review `semanticColors` and `semanticColorsDark` if the brand needs
   different surfaces or contrast in the two themes.
3. For a custom font: load it with `expo-font`, then set `typography.fontFamily.sans`.

No screen needs to be touched.

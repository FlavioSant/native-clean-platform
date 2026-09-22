# Dark mode

**Date:** 2026-09-22
**Status:** Approved

## Goal

Give this boilerplate a real dark theme instead of the single light value it
has today, so every app cloned from it starts with dark mode working rather
than adding it later. The app follows the OS appearance by default, with a
manual override the user can set from the account screen, persisted across
launches.

The target is the same "one place" promise the semantic colour aliases
already make for rebranding (`AGENTS.md` rule 6): a screen that already uses
`bg-background`/`text-content`/`bg-primary` needs no change at all to support
both themes.

## Scope

In:

- A dark value for every existing semantic colour alias, derived from the
  `brand`/`neutral` scales already in `tokens.js` — no new palette, since this
  is a boilerplate and has no brand of its own yet.
- The mechanism: reading the OS preference, a manual override with a
  `'system' | 'light' | 'dark'` tri-state, persisted in `AsyncStorage`, applied
  at boot before the account screen (or any screen) can be reached.
- Migrating the two places that read a colour outside NativeWind
  (`SplashScreen`, `SubmitButton`) to the active theme instead of a fixed
  light value.
- The account-screen control that sets the override.

Out:

- Any actual brand palette — an app cloned from this boilerplate replaces
  `colors.brand` and gets both themes from the same scale, exactly as it does
  today for light only.
- Extending `success`/`warning`/`info` (and `danger`'s missing dark step) with
  new scale steps. None of the three is used anywhere in the app today, and
  `danger-surface` — the one role that would want one — reuses a neutral
  surface in the dark theme instead (D5).
- A reusable `SegmentedControl` primitive in `src/components/`. The account
  screen's toggle is three inline `Pressable`s, matching how its other rows
  are already built; a second consumer would be the reason to promote it.
- Any color usage this audit did not find. `SplashScreen` and `SubmitButton`
  are the only two raw, out-of-NativeWind colour reads in the codebase today
  (confirmed by search); a third one introduced later follows the same
  pattern documented here, by review, not by more code now.
- True-black/OLED, high-contrast, or any variant beyond light/dark.
- Animating the transition between themes.

## Decisions

### D1 — `vars()` at runtime, not static CSS, not per-utility `dark:` classes

Three ways exist to make `bg-background` resolve to a different colour under
dark mode:

1. **Static CSS custom properties** (`:root { --color-background: ... }`,
   `.dark { --color-background: ... }` in `global.css`), referenced from
   `tailwind.config.js` as `var(--color-background)`. Rejected: the values
   would have to be typed a second time, by hand, in a `.css` file that
   `tokens.js` cannot generate into without a build step — exactly the
   duplication `ARCHITECTURE.md` already avoids between `tailwind.config.js`
   and the tokens (§5). This repo has no `dist/` separate from `src/` on
   purpose; a generated `global.css` would reintroduce that.
2. **A `dark:` variant on every semantic utility** (`bg-background
   dark:bg-background-dark`). Rejected: every screen that uses an alias today,
   and every one written after, needs the variant added by hand — the reverse
   of rule 6's "one place."
3. **NativeWind's `vars()` helper at runtime** (`nativewind` /
   `react-native-css-interop`; installed, version 4.2.6). A root component
   applies `style={vars({ '--color-background': '#...', ... })}` on a `View`
   wrapping the whole tree, recomputed whenever the resolved scheme changes.
   `tailwind.config.js` maps every semantic key to `var(--color-<key>)`,
   derived from `Object.keys(semanticColors)` — never typed twice. The literal
   values live only in `tokens.js`, in plain JS objects, which is also what
   the two raw-colour call sites read directly. **Chosen.**

`darkMode: 'class'` stays in `tailwind.config.js` as-is; nothing under this
design reads it (no `.dark` class is ever applied), so it is inert rather
than wrong. Removing it is unrelated churn.

### D2 — `useColorScheme`/`colorScheme` from `nativewind`, not a hand-rolled store

`nativewind` (re-exporting `react-native-css-interop`) already ships:

```ts
// node_modules/nativewind/dist/stylesheet.d.ts
function useColorScheme(): {
  setColorScheme(scheme: "light" | "dark" | "system"): void;
  toggleColorScheme(): void;
  colorScheme: "light" | "dark" | undefined;
};

// node_modules/react-native-css-interop/dist/runtime/native/appearance-observables.d.ts
const colorScheme: {
  set(value: "light" | "dark" | "system"): void;
  get(effect?: Effect): "light" | "dark";
  toggle(): void;
};
```

The hook is for components; the plain object is for module scope, the same
shape `configureAuthorization` already uses to reach outside React. Neither
persists anything (confirmed against the NativeWind docs) and neither exposes
"the user is currently on `system`" — only the **resolved** value. That gap is
exactly what `useThemePreference` (D3) exists to close; nothing else about
scheme resolution or applying it to style is reimplemented.

### D3 — `useThemePreference` is a plain hook, not a Context, and it alone owns "apply"

Two things call `useThemePreference()`: `ThemeProvider`, for its boot-time
side effect, and the account-screen toggle, to read and change the value. The
hook's mount effect does both parts of "hydrate" in one step — read
`AsyncStorage`, then call `colorScheme.set()` with what it read — so hydrating
and applying are never two separately-owned responsibilities. `ThemeProvider`
does not call `colorScheme.set()` itself; it calls the hook purely for that
effect and reads the resolved scheme separately, via `useColorScheme()` (D2),
for its own `vars()` computation.

Each call site gets its own `useState`, hydrated independently. That's safe,
not racy: `ThemeProvider` mounts once, at the very top of the tree, before
`RootNavigator` — and the account screen only exists behind sign-in, so its
own hydration can never run before `ThemeProvider`'s already has. No two
mounts call `setPreference` (the only write) concurrently — only a user
tapping the toggle does, and by then boot has long finished. `AsyncStorage`
is the single source of truth every mount converges on; a Context would
synchronise a value whose only two consumers already agree once each has
read storage once.

### D4 — Where the new code lives: `src/theme/`, not `src/hooks/`

`src/errors/` already mixes a pure function (`classify.ts`), a component
(`ErrorBoundary.tsx`) and a hook (`useErrorToast.ts`) under one topical
folder rather than splitting by kind. Theming gets the same treatment:
`ThemeProvider.tsx`, `useThemePreference.ts` and `useThemeColors.ts` join
`tokens.js`/`index.ts` in `src/theme/`. `src/hooks/` (still uncreated) is for
a hook with no single topical home; this one has one.

### D5 — `danger-surface` reuses a neutral dark surface; the scale is not extended

Every raw-colour and semantic-alias call site was read before proposing a
mapping (not inverted mechanically):

- `content-inverse` is **always** text on a `bg-primary`-filled control (5
  call sites: `SubmitButton`, `HomeScreen`, `ErrorBoundary`, `AccountScreen`,
  `SessionsScreen`). Its job is "reads on `primary`," not "the opposite of
  `content`" — it stays `neutral[0]` (white) in both themes.
- `danger-surface` is used twice (`ErrorToast`, `FormErrorMessage`), always a
  pale tint behind `text-danger`. `colors.danger` only defines `{50, 500, 600,
  700}` — no dark/near-black step exists for it, unlike `brand`/`neutral`
  which were given the full 50→950 range for exactly this reason. Adding one
  (`colors.danger[900]`) would grow the token schema for a single use, and
  `success`/`warning`/`info` are unused anywhere today. The dark value reuses
  `neutral[800]` (the same step `surface-muted` uses); `text-danger` next to
  it still carries the meaning. Scope explicitly excludes extending the
  scales (see Scope, Out).
- `primary` and `danger` shift one scale step lighter in dark
  (`brand[500]→brand[400]`, `danger[600]→danger[500]`): the mid-tone step
  reads muddier against a near-black background than against white.
  `primary-pressed`/(no separate `danger`-pressed exists) keeps the same
  "one step darker on press" relationship, now `brand[500]`.
- `content-muted` moves to `neutral[400]`, not the mechanical mirror of
  `neutral[500]` (light's value): `neutral[500]` against `neutral[950]` falls
  short of comfortable contrast; one step lighter than the literal mirror
  fixes it without inventing a new token.
- Every other alias mirrors the light value across the same scale
  (`background`, `surface`, `surface-muted`, `border`, `border-strong`,
  `content`).

| alias | light (today) | dark (new) |
|---|---|---|
| `background` | `neutral[50]` | `neutral[950]` |
| `surface` | `neutral[0]` | `neutral[900]` |
| `surface-muted` | `neutral[100]` | `neutral[800]` |
| `border` | `neutral[200]` | `neutral[700]` |
| `border-strong` | `neutral[300]` | `neutral[600]` |
| `content` | `neutral[900]` | `neutral[50]` |
| `content-muted` | `neutral[500]` | `neutral[400]` |
| `content-inverse` | `neutral[0]` | `neutral[0]` (unchanged) |
| `primary` | `brand[500]` | `brand[400]` |
| `primary-pressed` | `brand[600]` | `brand[500]` |
| `danger` | `danger[600]` | `danger[500]` |
| `danger-surface` | `danger[50]` | `neutral[800]` |

### D6 — The boot-time flash is accepted, not gated

`AsyncStorage` has no synchronous read, unlike `readApiBaseUrl`'s
`process.env` read. A stored **manual override** that differs from the OS
value can therefore paint once in the default (system-resolved) theme before
`ThemeProvider`'s mount effect applies it — sub-frame on native, and it never
happens at all for the (default, recommended) `'system'` preference, since
that one is already correct from `Appearance` with no storage read involved.
Gating first paint behind the read (mirroring `useAuthSession`'s
`hasCompletedBoot`) would delay every launch for a UI preference, and
duplicate a boot gate that already exists for a reason unrelated to theming.

## Design

### 1. `src/theme/tokens.js`

- Add `semanticColorsDark`, same keys as `semanticColors`, values per the D5
  table — plain object literals referencing `colors.brand`/`colors.neutral`/
  `colors.danger`, no new hex.
- Export it alongside the existing tokens in `module.exports`.

### 2. `src/theme/tokens.test.ts` (new)

Asserts `Object.keys(semanticColors).sort()` equals
`Object.keys(semanticColorsDark).sort()`. Without this, a key present in one
map and missing in the other resolves to `undefined` inside `vars()` silently
— no type system catches it, since `tokens.js` has no hand-written `.d.ts`
(`ARCHITECTURE.md` §5) and both objects are plain JS.

### 3. `tailwind.config.js`

```js
const themeColorVars = Object.fromEntries(
  Object.keys(semanticColors).map((key) => [key, `var(--color-${key})`]),
);

// theme.extend.colors: { ...colors, ...themeColorVars } instead of
// { ...colors, ...semanticColors }
```

`colors` (the raw scales) is untouched — `bg-neutral-500` still resolves to a
literal value; only the semantic aliases become variable references.

### 4. `src/theme/ThemeProvider.tsx` (new)

- Calls `useThemePreference()` (§5) purely to trigger its mount effect —
  reading `AsyncStorage` and applying the result via `colorScheme.set()`
  happen inside that hook (D3), not here. `ThemeProvider` does not read or
  branch on the returned `preference` value.
- Reads the resolved scheme via `useColorScheme()` (`nativewind`).
  `undefined` (not yet resolved) maps to light, the existing default.
- Renders a `View` with `className="flex-1"` and `style={vars(cssVars)}`,
  where `cssVars` maps `'--color-<key>'` to the active map's value
  (`semanticColors` or `semanticColorsDark`, chosen by the resolved scheme) —
  the same selection `useThemeColors` (§6) makes, factored into one private
  helper so the two can't disagree.
- Mounted in `App.tsx` inside `GestureHandlerRootView` (which must stay
  outermost, unrelated to theming) and outside everything else — every screen,
  including `SplashScreen`, is a descendant, so `vars()` is in scope for the
  whole app from the first frame.

### 5. `src/theme/useThemePreference.ts` (new)

```ts
export const THEME_PREFERENCES = { SYSTEM: 'system', LIGHT: 'light', DARK: 'dark' } as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[keyof typeof THEME_PREFERENCES];
```

- `THEME_PREFERENCE_STORAGE_KEY` constant, namespaced like
  `REFRESH_TOKEN_STORAGE_KEY` (`theme.preference`).
- `useState<ThemePreference>(THEME_PREFERENCES.SYSTEM)`, hydrated from
  `AsyncStorage` in a mount effect. The same effect calls `colorScheme.set()`
  with whatever it read (or leaves the default untouched if nothing was
  stored) — hydrating and applying are one step, owned here alone (D3).
  Default stays `'system'` until the read resolves (matches D6).
- `setPreference`: updates state, persists to `AsyncStorage`, calls
  `colorScheme.set(next)` — the same apply the mount effect performs, now for
  a user-triggered change instead of a boot-time read.
- Returns `{ preference, setPreference }`.

### 6. `src/theme/useThemeColors.ts` (new)

Returns the active semantic map (`semanticColors` or `semanticColorsDark`)
for the two call sites that need a literal value outside NativeWind. Shares
the scheme→map selection helper with `ThemeProvider` (§4).

### 7. `src/screens/SplashScreen.tsx`, `src/components/SubmitButton.tsx`

Replace `colors.brand[500]` / `colors.neutral[0]` with
`useThemeColors().primary` / `useThemeColors()['content-inverse']` (bracket
access for the one key with a hyphen — same reason `tokens.js` itself
disables `useNamingConvention`: the key shape is dictated by the Tailwind
class name it mirrors, not chosen by us).

### 8. `src/modules/auth/screens/AccountScreen.tsx`

- New `COPY` entries: `appearanceLabel`, `systemLabel`, `lightLabel`,
  `darkLabel`.
- A new row above or below the existing actions: three `Pressable`s bound to
  `useThemePreference()`, styled like the screen's existing primary/secondary
  buttons (`bg-primary`/`text-content-inverse` for the selected one,
  `border-border`/`text-content` for the other two).
- `accessibilityRole="button"`, `accessibilityState={{ selected: preference
  === THEME_PREFERENCES.<X> }}` per option.

### 9. `App.tsx`

`ThemeProvider` wraps everything below `GestureHandlerRootView`:

```tsx
<GestureHandlerRootView style={ROOT_STYLE}>
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      {/* unchanged */}
    </QueryClientProvider>
  </ThemeProvider>
</GestureHandlerRootView>
```

### 10. `app.json`

`userInterfaceStyle: "light"` → `"automatic"`. Expo's own docs describe the
key as forcing light/dark **or** letting the app adapt to the system — left
at `"light"`, the OS never reports a dark preference to `Appearance`/
`useColorScheme` at all, independent of anything built here.

### 11. `package.json`

`@react-native-async-storage/async-storage`, added via `expo install` (exact
pinned version, like every other dependency here — `ARCHITECTURE.md` §9).
Bundled in Expo Go for SDK 57 (confirmed: Expo Go 57.0.9 ships
`async-storage` 2.2.0), so no dev client is needed.

## Testing

- `tokens.test.ts` — key parity (§2).
- `useThemePreference.test.ts` — defaults to `'system'`; `setPreference`
  persists and calls `colorScheme.set`; hydrates from a pre-seeded
  `AsyncStorage` value on mount.
- `ThemeProvider`/`useThemeColors` — tested through `useThemeColors()`'s
  return value changing when `colorScheme.set()` is called (via a probe
  component and `act`), not by asserting on `vars()`-resolved rendered
  colours: NativeWind's own style resolution is its library's concern, not
  ours, and asserting our scheme→map selection is the behaviour this design
  actually owns.
- `AccountScreen.test.tsx` (existing file, extended) — mocks
  `useThemePreference` the same way it already mocks `useAuth`/`useSessions`;
  pressing "Dark" calls `setPreference('dark')`.
- `jest.setup.ts` gains an in-memory `AsyncStorage` mock, same shape as the
  existing `expo-secure-store` mock.

## Documentation

- `src/theme/README.md` — `## Components` (`ThemeProvider`) and `## Hooks`
  (`useThemePreference`, `useThemeColors`) sections, new `Constants` row for
  `semanticColorsDark`, and the "dark mode not implemented" line in
  Conventions replaced with how it works.
- `AGENTS.md` rule 6 — replace the "will, once it exists" wording with the
  real mechanism, pointing at `ARCHITECTURE.md` §5.
- `ARCHITECTURE.md` §5 — the `vars()` architecture, the D1 rejection of the
  other two approaches, and the token table from D5. §10 loses "dark mode."
- Root `README.md` — one line confirming step 1 of "Adapting to a new app"
  (replace `colors.brand`) already carries both themes, since
  `semanticColorsDark` references the same scale.

`src/modules/auth/README.md` is not touched: the toggle adds no navigation
edge, and its `## Components` entry for `AccountScreen` does not itemise
internal rows.

## Delivery slices

1. **Tokens + mechanism, together.** `semanticColorsDark` +
   `tailwind.config.js`'s var-mapping switch, `ThemeProvider`,
   `useThemePreference`, `useThemeColors`, the `App.tsx`/`app.json` wiring,
   the `async-storage` dependency, and their tests — all in one slice. These
   cannot ship separately: the moment `tailwind.config.js` references
   `var(--color-<key>)`, every screen's semantic classes resolve to nothing
   without a `vars()`-providing ancestor already mounted. Splitting this
   slice would leave the app visibly broken between commits.
2. `SplashScreen`/`SubmitButton` migrated off raw `colors.*`.
3. The `AccountScreen` toggle + tests.
4. Documentation.

## Verification

`pnpm check` and `pnpm test:ci` after every slice.

**Not verifiable here**, and must not be claimed: WSL2, no simulator or
device. Nothing in this spec proves the dark palette reads comfortably on a
real screen, that `async-storage` resolves correctly inside Expo Go, or that
the boot flash is actually imperceptible. Needs a device:

1. Open the app with the OS in dark mode, preference untouched (default
   `'system'`) — expect the dark theme from the first frame, no flash.
2. Toggle the OS appearance while the app is open and `preference` is
   `'system'` — expect the app to follow immediately, no restart.
3. Set a manual override, kill and relaunch the app — expect it to still
   apply, and note whether the boot flash from D6 is actually visible.
4. Turn on VoiceOver/TalkBack and navigate the new appearance row — expect
   each option's selected state announced.

## Out of scope / explicitly deferred

Any real brand palette · extending `success`/`warning`/`info`/`danger`'s dark
steps · a reusable `SegmentedControl` · raw-colour call sites this audit did
not find · true black/OLED and high-contrast variants · animating the theme
transition · per-device vs. synced preference (no backend concept exists for
it).

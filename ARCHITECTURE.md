# Architecture

Documentation of what **exists in this repository**. Nothing here is a plan or
an intention — if it is written down, it is built and verifiable by running the
commands in §9.

This is the only versioned architecture document.

**Stack today:** Expo SDK 57 (managed) · React Native 0.86 · TypeScript 7 ·
NativeWind v4 (Tailwind 3.4) · React Navigation 7 · TanStack Query 5 · axios ·
react-hook-form 7 + zod 4 · expo-secure-store · @react-native-community/netinfo ·
Jest (jest-expo) +
React Native Testing Library · Biome · pnpm

---

## 1. The principle

> **Nothing outside a module imports a file from inside it.**

A module (`src/modules/<name>/`) exposes its entire public surface through a
single `index.ts`. Everything else — screens, hooks, API calls, internal
components — is implementation, and implementation is not imported from
outside. Modules do not import each other either: code that more than one
module needs moves up to `src/components/` (from the second consumer on) or to
a top-level module — `src/hooks/`, `src/lib/`, `src/store/` — created when
something actually needs it, not before.

This repository is **front-end only**. The backend the app talks to lives in a
separate repository (`api-clean-platform`) — server, database, or token-issuing
code never enters here. That is why this document has no database section, no
domain-error taxonomy and no infra layer: none of that is this side of the
boundary's responsibility.

Today there is **one module**, `auth` (§2), built against thirteen of the
fourteen `/auth` endpoints of `api-clean-platform` (only `POST /auth/google` is
deferred). It is the reference shape for the next one: its `index.ts` defines
what the rest of the app sees, and it is what forced the two missing top-level
modules into existence — `src/config/` and `src/lib/`.

---

## 2. The tree

```text
App.tsx                    root: providers (gesture handler, query client, safe area, status bar, errors, session) + navigation
index.ts                   registerRootComponent — the Expo entrypoint
global.css                  Tailwind entry, imported by App.tsx
biome.json                  linter + formatter (replaces ESLint and Prettier)
tailwind.config.js          reads the tokens from src/theme/tokens.js
tsconfig.json               extends expo/tsconfig.base — strict, noUncheckedIndexedAccess, @/ alias
pnpm-workspace.yaml         pnpm settings — pnpm 11 no longer reads .npmrc (§9)
jest.setup.ts               test EXPO_PUBLIC_* + in-memory keychain (expo-secure-store mock)
.env.example                EXPO_PUBLIC_API_URL — copy to .env before running
src/
├── components/               UI primitives known in advance to be multi-app — a documented exception to the second-consumer rule
│   ├── FormErrorMessage.tsx  form error message; `null` renders nothing
│   ├── FormScreen.tsx        form screen root: keyboard + scroll
│   ├── SubmitButton.tsx      submit button with spinner + disabled via `isPending`
│   ├── *.test.tsx            colocated, one per component
│   ├── inputs/               pure primitives, no react-hook-form
│   │   ├── TextInput.tsx     base: label, value/onChangeText, error, className
│   │   ├── EmailInput.tsx    email keyboard/autocomplete
│   │   ├── PasswordInput.tsx  secureTextEntry + variant 'current' | 'new'
│   │   ├── CodeInput.tsx     numeric keyboard, one-time-code, `digits` from the caller
│   │   └── *.test.tsx        colocated, one per component
│   ├── forms/                 the react-hook-form integration
│   │   ├── FormField.tsx     Controller + dispatches to the right input by `type`
│   │   └── FormField.test.tsx
│   ├── index.ts
│   └── README.md
├── config/                  environment variables, validated on load
│   ├── env.ts               readApiBaseUrl() + API_BASE_URL — fails loudly if missing or, outside dev, if not https
│   ├── env.test.ts          colocated
│   ├── index.ts
│   └── README.md
├── errors/                   a single answer to "what happens when something fails"
│   ├── classify.ts          ERROR_KINDS + classifyError/isRetryable/shouldRetry
│   ├── copy.ts              base map + per-module registry → the sentence the user reads
│   ├── reporter.ts          the seam between QueryCache.onError and the toast provider
│   ├── queryClient.ts       createQueryClient() — the app's QueryClient policy, with typed `meta`
│   ├── applyServerFieldErrors.ts  an ApiError's details[] → react-hook-form fields
│   ├── ErrorBoundary.tsx    the ONLY class in the code (React requires it) + the fallback screen
│   ├── ErrorToast.tsx       context + provider + host, a single slot
│   ├── useErrorToast.ts     { showError }
│   ├── reporting.test.tsx   integration: a failing query/mutation does (or does not) reach the toast
│   ├── *.test.ts(x)         colocated
│   ├── index.ts
│   └── README.md
├── lib/                      I/O without React — no hook, no context, no component
│   ├── api/                 its own folder: interceptors, client and response validation
│   │   ├── client.ts        axios instance, wiring of the 2 interceptors, api (get/post/patch/delete)
│   │   ├── requestInterceptor.ts   bearer token + configureAuthorization/getAuthorizationHandlers
│   │   ├── responseInterceptor.ts  ApiError, API_ERROR_CODES, error translation + refresh retry
│   │   ├── parseOrThrow.ts  validates the response against a zod schema; drift becomes an ApiError
│   │   └── *.test.ts        colocated — client.test.ts swaps defaults.adapter to exercise the interceptors
│   ├── connectivity.ts      NetInfo → onlineManager: without it RN "is always online"
│   ├── index.ts             does not re-export the instance: from outside, only api
│   └── README.md
├── screens/                 screens that do not belong to any specific module
│   ├── HomeScreen.tsx       the signed-in shell — leads to the account area
│   ├── SplashScreen.tsx     only during boot, while the stored token is verified
│   ├── index.ts
│   └── README.md
├── navigation/               composition root: lists modules, not screens
│   ├── RootNavigator.tsx    splash while the session is unknown, then the NavigationContainer
│   ├── RootStack.tsx        one Stack.Screen per module — renders only the side the session picks
│   ├── RootNavigator.test.tsx  colocated — the gate end to end: real provider, only `api` swapped
│   ├── AppStack.tsx         the signed-in shell — HomeScreen + the auth module's AccountStack
│   ├── types.ts             RootStackParamList/AppStackParamList — the single declaration of route names
│   ├── index.ts
│   └── README.md
├── modules/                  one module per feature — format and full list in src/modules/README.md
├── theme/                    design tokens — single source of truth
│   ├── tokens.js             CommonJS: feeds tailwind.config.js (Node) and TS (via index.ts)
│   ├── ThemeProvider.tsx     applies the active theme via NativeWind's vars(); mounted in App.tsx
│   ├── useThemeColors.ts     active semantic map, for the rare case that needs a literal value outside NativeWind
│   ├── useThemePreference.ts { preference, setPreference } — manual override, hydrated from AsyncStorage
│   ├── themePreferenceStorage.ts  reads/writes the preference in AsyncStorage
│   ├── index.ts              re-exports tokens + parsePixels() for app code
│   ├── *.test.ts(x)          colocated
│   └── README.md
└── utils/                    pure helpers, no React and no I/O
    ├── classnames.ts         clsx + tailwind-merge — conditional className merging
    ├── classnames.test.ts    colocated
    ├── index.ts
    └── README.md
```

Every folder in `src/` — and every module inside `src/modules/` — has its own
`README.md`, which is the simplified documentation of what that folder
exports. That is where each one's `Components` / `Hooks` / `Functions` /
`Constants` are listed; this document does not repeat that inventory, only the
format and the rules that cut across folders.

`src/modules/` is deliberately left unexpanded here: unlike the rest of the
tree, the number of modules grows with the app — one per feature — and detailing
each would make this section grow without bound and go stale with every renamed
hook. `src/modules/README.md` has the generic shape of a module and the list of
the ones that exist today; each module's `README.md` has its exports and its
own `## Flow` diagram.

### The module boundary rule

| Who | May import |
|---|---|
| a file inside `src/modules/<m>/**` | any file of the same module |
| any file outside `src/modules/<m>/` | only what `src/modules/<m>/index.ts` exports |
| `src/modules/<m>/**` | never `src/modules/<other>/**` |
| `src/lib/**` | no React and no module — only network, storage and the like |
| `src/errors/**` | may import from `src/lib/`; never the other way around, and never a module |
| `src/config/**` | nothing beyond the environment; it is a leaf, it imports no one |

A component only leaves a module for `src/components/` when a **second** module
starts needing it — before that, moving it is speculation.

**Exception:** a design-system primitive that any app cloned from this
boilerplate is going to need — today, the form inputs in
`src/components/inputs/`, `forms/`, and `FormErrorMessage`/`SubmitButton` at the
root — may be born in (or be promoted straight to) `src/components/` even with
a single consumer in this repository. The "second consumer" here is the next
app, not the next module: any form screen in any cloned app needs an error
message and a submit button with a pending state, so both left
`modules/auth/components/` together with the inputs — it is no longer the case
that "there is no equivalent argument" that kept `SubmitButton` behind.

**Biome checks the part that can be checked**, with `style/noRestrictedImports`
(`patterns`) and overrides in `biome.json`:

- in any file, `@/modules/<m>/<anything>` is an error — only the
  `@/modules/<m>` barrel passes. Inside the module the imports are relative, so
  the rule does not reach them;
- `src/lib/**` does not import `react`, `react-native`, `@/components`,
  `@/errors` or any module;
- `src/errors/**` does not import a module;
- `src/modules/<m>/**` does not import `@/modules/**` — another module, nor
  itself through the alias.

**Limits, so this is not mistaken for full coverage.** The lint sees the `@/`
alias, not a relative path that escapes the folder (`../../modules/x/...`) —
that one remains a review catch, along with the rule of never writing `../../`.
And the last item is an override **per module**: a new module needs its own
block in `biome.json`, otherwise nothing stops it from importing another
(`src/modules/README.md`). There is no dependency-cruiser; Biome already covers
what is written above.

`modules/<m>/components/` starts **flat** (one file per component).
Subfolders by category are only worth it when distinct categories become
visible in there — that split is not created in advance.

`src/components/` escapes this rule from the start: `inputs/` (pure UI
primitives) and `forms/` (the react-hook-form integration) are already two
real, distinct categories on the day the folder gets its first export — not a
speculative split.

---

## 3. Imports

`@/` points to `src/` — declared in `tsconfig.json`
(`paths: { "@/*": ["./src/*"] }`) and resolved by Metro through the Expo Babel
preset. Never write `../../`.

Unlike the API repo, here there is **no build step** separating `src/` from
`dist/`: Metro compiles TypeScript straight from `src/` into the bundle, in both
development and the production build. So there is no pitfall of serving stale
compiled code because of a forgotten runtime flag — there is no `dist/` to
diverge from `src/`.

---

## 4. Rules with teeth

A rule that is not checked by a machine is an agreement, and an agreement does
not survive N derived projects. These fail `pnpm check`:

| Rule | Mechanism | Checked |
|---|---|---|
| A component is always an arrow function | Biome `nursery/useReactFunctionComponentDefinition` (`namedComponents: arrowFunction`) | ✅ `pnpm lint` |
| A function expression is always an arrow function, never `function (...) {}` | Biome `style/useArrowFunction` (stable rule of the `recommended` preset) | ✅ `pnpm lint` |
| No magic number | Biome `style/noMagicNumbers`, exempting `**/*.test.ts`/`**/*.test.tsx` | ✅ `pnpm lint` |
| No `console.*` — the most common way for a token to end up in logcat | Biome `suspicious/noConsole` | ✅ `pnpm lint` |
| Type in PascalCase; variable/const in `camelCase`, `PascalCase` or `CONSTANT_CASE` | Biome `style/useNamingConvention`, exempting `src/theme/tokens.js` | ✅ `pnpm lint` |
| Indexed access returns `T \| undefined` | `tsconfig.json`: `noUncheckedIndexedAccess` | ✅ `pnpm typecheck` |
| `@tailwind` does not trigger an unknown at-rule | Biome override `noUnknownAtRules: off` in `**/*.css` | ✅ avoids a false positive |
| Module boundary, `lib` without React and `errors` without a module (§2) | Biome `style/noRestrictedImports` + per-folder overrides; only sees imports through the `@/` alias | ✅ `pnpm lint` |

**What still depends on human review alone:**

| Rule | Status |
|---|---|
| Module boundary through a relative path (§2) | ⚠️ review catch — the lint only sees the `@/` alias |
| Magic string (Biome only covers numbers) | ⚠️ review catch |
| Named function declaration (`function foo() {}`, as opposed to an expression) | ⚠️ Biome covers expressions, not declarations |
| Tailwind class ordering | ⚠️ off on purpose — `useSortedClasses` is still *work in progress* and does not understand the semantic tokens (§5); revisit when the rule stabilises |

### Do / Don't

| ✅ | ❌ |
|---|---|
| `export const Button = (props: ButtonProps) => …` | `export function Button(props: ButtonProps) { … }` |
| `navigation.navigate('Home')`, declared in `AppStackParamList` | A route name that is not in the param list — `tsc` rejects it |
| `const REQUEST_TIMEOUT_MS = 5000` | A bare `5000` in the middle of the code |
| `bg-primary`, `text-content-muted` (semantic) | `bg-brand-500`, `text-neutral-900` (raw) |
| `import { X } from '@/theme'` | `import { X } from '../../theme'` |
| `class ErrorBoundary extends Component` | A "functional" boundary — `getDerivedStateFromError` does not exist as a hook |
| Exact version in `package.json`, bumped with `expo install` | A `^`/`~` or a hand-edited version outside what `expo install` would resolve |

---

## 5. Theme and styling

`src/theme/tokens.js` is the **single source of truth**, and it is CommonJS on
purpose: the same file feeds `tailwind.config.js` (Node) and the TypeScript
code, via `src/theme/index.ts`, with the types inferred from the file itself — a
token never diverges between the two sides.

The values are CSS strings (`'16px'`), not numbers: NativeWind compiles
Tailwind to CSS before converting to native styles, and a bare number is not
valid CSS. To use a token outside NativeWind (an `ActivityIndicator` colour,
for example), `parsePixels()` converts it back to the number the native API
expects.

### Raw vs. semantic colours

| Use this | Instead of this |
|---|---|
| `bg-background`, `bg-surface` | `bg-neutral-50` |
| `text-content`, `text-content-muted` | `text-neutral-900` |
| `bg-primary` | `bg-brand-500` |
| `border-border` | `border-neutral-200` |

Rebranding then happens in a single place (`semanticColors`/`semanticColorsDark`,
in `tokens.js`) — no screen needs to be touched.

**Dark mode works through CSS variables applied at runtime, not through a
`dark:` class or static CSS.** `tailwind.config.js` maps each semantic alias to
`var(--color-<alias>)`; `ThemeProvider` (`src/theme/ThemeProvider.tsx`),
mounted right below the `GestureHandlerRootView` in `App.tsx`, decides the
value of each variable via NativeWind's `vars()`, choosing between
`semanticColors` and `semanticColorsDark` according to the resolved theme. The
two other approaches — static CSS with `:root`/`.dark`, or a `dark:` variant on
every class — were discarded: the first would duplicate the values outside
`tokens.js`; the second would require touching every screen that uses an alias.

The user follows the system by default; `useThemePreference()`
(`src/theme/useThemePreference.ts`) stores a manual override
(`'system' | 'light' | 'dark'`) in `AsyncStorage` and applies it via NativeWind's
own `colorScheme.set()`. `app.json` uses `"userInterfaceStyle": "automatic"` —
pinned to `"light"`, the operating system would never report a dark theme to
the app, regardless of anything here.

### `classnames()` and the styling rule

`src/utils/classnames.ts` combines `clsx` (conditional joining) with
`tailwind-merge` (conflict resolution — `classnames('p-2', 'p-4')` → `'p-4'`).
It is what every component that accepts a `className` prop uses to let its
consumer adjust layout without extra `View`s.

**NativeWind classes only — no `StyleSheet.create` or inline style object**,
unless an API forces it. The only exception today is `ROOT_STYLE` in
`App.tsx`: `GestureHandlerRootView` needs a real style object because
NativeWind does not reach that prop — `const ROOT_STYLE = { flex: 1 } as const`,
extracted so as not to repeat a loose object literal in the JSX.

---

## 6. Navigation

**React Navigation**, not Expo Router: explicit, typed routes in
`src/navigation/`, without coupling the folder structure to navigation. All
navigation lives there and nowhere else.

`src/navigation/` is a **composition root**: it lists modules, not screens.
`RootStack` has one `Stack.Screen` per module, and each module's screens live
in the module's own navigator (`src/modules/auth/navigation/AuthStack.tsx`).
Route names are literals at the call site — `<Stack.Screen name="Home">`,
`navigation.navigate('Home')`. There is no constants object: the param list is
already the single declaration of each name, and duplicating it in a `const
object` would give two sources for the same truth without gaining any checking.

`RootStackParamList` (in `types.ts`) is registered globally:

```ts
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
```

That registration is what makes `navigation.navigate()` typed anywhere in the
app without having to import the param list manually. Each entry uses
`NavigatorScreenParams<...>`, which is what keeps a nested
`navigate('App', { screen: 'Home' })` typed.

**Adding a screen is two edits — in the pair belonging to its module:** one
entry in the param list in `types.ts` and one `Stack.Screen` in that module's
navigator. Forgetting the first breaks `tsc` — it is not a convention, it is the
compiler. Adding a new **module** touches its `navigation/` plus one line in
`types.ts` and another in `RootStack.tsx` here.

Route names are PascalCase by React Navigation convention, and since they are
now literal keys of the param list, `biome.json` allows PascalCase
`typeProperty` for `**/navigation/types.ts` (§9).

### Current state

`RootNavigator` shows the `SplashScreen` while the session is unknown
(`AUTH_STATUSES.LOADING`) and only then mounts the `NavigationContainer` —
mounting the container during boot would mean mounting a navigator whose first
screen would be replaced right after.

`RootStack` renders **only one side**: `AuthStack` when signed out, `AppStack`
when signed in. Rendering only one side, instead of registering both and
navigating, is what stops the Android back button, with no history, from
returning to a signed-in screen after logout.

The design is that of the `modularizing-react-navigation` skill
(`.claude/skills/`), now with code: `auth` is the first module to have its own
navigator.

---

## 7. Tests

**Jest**, via the `jest-expo` preset, plus **React Native Testing Library** for
components.

- Tests are **colocated** — `classnames.ts` + `classnames.test.ts`, never in a
  `__tests__/` folder. The `.test.ts`/`.test.tsx` suffix is not just a naming
  preference: it is exactly what the Biome override matches to exempt
  `noMagicNumbers` (§4) — a differently named file (`.spec.tsx`, inside
  `__tests__/`) still runs as a test but silently loses the exemption and
  breaks `pnpm lint`.
- Pure logic (`src/utils/`, hooks, module logic) uses plain Jest —
  `describe`/`it`/`expect`, as in `classnames.test.ts`.
- Components and screens use `@testing-library/react-native`, testing
  behaviour observable by the user — rendered text, accessibility state,
  `fireEvent`. **Never** snapshot tests. In the installed version, `render()`
  and `fireEvent.*()` return a Promise and need `await` — omitting it produces
  a confusing failure further on, not an obvious error at the call site.

`pnpm test` is **not** part of `pnpm check` — typecheck and lint remain the
fast pre-commit gate; tests run on demand or in CI.

There is no E2E suite in this repository today — Maestro was removed because it
required a local Android Studio or iOS Simulator setup, which this environment
does not have.

---

## 8. Commands

```bash
pnpm install
pnpm start               # Metro — opens Expo Go / dev tools
pnpm android              # opens on the Android emulator/device via Expo Go
pnpm ios                  # opens on the iOS simulator via Expo Go (macOS only)
pnpm web                  # opens in the browser
pnpm check                # typecheck + lint — run before every commit
pnpm typecheck            # tsc --noEmit
pnpm lint                 # biome check
pnpm lint:fix             # biome check --write
pnpm format               # biome format --write
pnpm test                 # jest --watchAll
pnpm test:ci               # jest --ci
```

`android/` and `ios/` are not in the repo: they are `expo prebuild` output, and
`.gitignore` ignores both. On the native side the prebuild is disposable — it
regenerates identically —, but it **edits versioned files** as a side effect,
and three things need to be undone after each run:

- it writes `android.package` into `app.json`, with the derived placeholder
  `com.anonymous.<slug>`;
- it rewrites the `android`/`ios` scripts from `expo start --*` to
  `expo run:*`, the dev client flow that left the repo along with Maestro;
- it reformats `app.json`, which breaks `pnpm lint` until `pnpm lint:fix` runs.

So: `git checkout -- package.json`, delete the `package` line from `app.json`,
`pnpm lint:fix`, and confirm in `git diff` that only the intended change is
left — today the ones that touch the native side on purpose are
`blockedPermissions` and the `expo-build-properties` release flags, both in
`app.json` (§9).

---

## 9. Versions and locked decisions

**Dependencies use exact versions, without `^`/`~`**, as in the API repo:
pinning everything eliminates divergence between cloned apps. The SDK versions
are the ones `expo install` resolves for Expo 57 — to bump one, use `expo
install` instead of editing the number by hand, which is what `expo-doctor`
exists to catch.

**`pnpm-workspace.yaml`, not `.npmrc`.** pnpm 11 stopped reading `.npmrc` for
these keys; this is where they live:
- `nodeLinker: hoisted` — Metro does not reliably follow pnpm's symlinked
  `node_modules`, so the on-disk layout needs to be flat. Keep this line if
  this repo becomes a monorepo.
- `enablePrePostScripts: true` — Expo's native modules depend on `postinstall`
  scripts running.
- `minimumReleaseAgeExclude` — the list of Expo packages exempt from the
  minimum publication age pnpm now requires by default (protection against a
  compromised package published minutes ago); the SDK packages tested together
  need to be installable immediately after release.
- `allowBuilds: { '@parcel/watcher': true, unrs-resolver: true }` — build
  scripts of two specific packages, explicitly allowed; by default pnpm blocks
  dependencies' build scripts.

**`overrides: { js-yaml@3: 3.15.2 }` forces a version beyond what any direct
dependency asks for.** `js-yaml` 3.15.1 has the CVE GHSA-2883-xcg3-v3hh
(`maxTotalMergeKeys` does not bound CPU when the merge source is empty); it
only reaches this repo through `babel-plugin-istanbul`, whose own range
(`^3.13.1`) already allows the fixed version — but `pnpm update` does not
re-resolve a transitive dependency on its own, hence the version needing to be
forced here. Remove this override when the Jest toolchain starts shipping the
fixed `js-yaml` on its own.

**`pnpm-workspace.yaml` does not make this repo a monorepo** — it is a single
package; the file exists only because it is where these pnpm settings moved to.

**`packageManager: pnpm@11.22.0`** pins the pnpm version via Corepack — the same
mechanism as the API repo.

**`blockedPermissions` removes two permissions nothing uses.** The Android
manifest is not in the repo (§8), so the permission list is the one the Expo
bare template generates — and the template's own comment says "OPTIONAL
PERMISSIONS, REMOVE WHATEVER YOU DO NOT NEED". Nothing in the tree declares
`SYSTEM_ALERT_WINDOW` or `VIBRATE` outside `react-native`'s debug source set,
and the first is "draw over other apps": it shows up in the Play listing, goes
into the security questionnaire and is the overlay vector. Asking for it
without using it is a trust cost with nothing in return — and, in a
boilerplate, every cloned app would inherit it.

The `READ`/`WRITE_EXTERNAL_STORAGE` pair is left out of the block:
`expo-file-system` declares both in its own manifest with
`maxSdkVersion="32"`, and `blockedPermissions` injects `tools:node="remove"`,
which wins the merge against a library manifest — blocking here would remove a
permission a lib needs on Android 12 and below.

**R8 and resource shrinking enabled through `expo-build-properties`, not
through `gradle.properties`.** The bare template leaves
`android.enableMinifyInReleaseBuilds` at `false`, so the release ships with
native Java/Kotlin code neither shrunk nor obfuscated. Turning that on by
editing `android/gradle.properties` does not survive the next prebuild (§8) —
which is why both flags live in `app.json`, as plugin options: the versioned
config is the source, `android/` is output. The generated `proguard-rules.pro`
already keeps Reanimated and TurboModules, but **a real release still needs to
be exercised before publishing**: R8 breaks whatever depends on reflection, and
that does not show up in debug. Nothing here touches the JS bundle — that path
belongs to Hermes, already on by default.

**No JS obfuscation.** The bundle is public: whoever has the APK extracts
`assets/index.android.bundle` and runs `strings`, and Hermes bytecode keeps the
string table in the clear — API URL, the `/auth/*` paths, the storage key and
all of `COPY` come out readable from there. A `javascript-obfuscator` hides none
of that and charges dearly: Reanimated embeds ~200 worklets as readable JS
source in the bundle, because worklets are compiled at runtime on the UI
thread, and rewriting those strings breaks the animations in release only. The
defence is architectural and already in place — access token in memory only,
refresh token in the keystore/keychain, and no rule decided on the client.

**The keystore belongs to EAS, never to the repo.** The `release` block the
prebuild generates signs with the *debug* keystore, password `android` in plain
text; Play refuses it, and an APK like that is for measuring, not distributing.
`.gitignore` already blocks `*.jks`/`*.keystore`/`credentials.json` so that the
real one does not reach a remote even by accident — a leaked keystore can no
longer sign updates to the app published under it.

**NativeWind v4 + Tailwind 3.4, not the NativeWind v5 preview.** v4 is the
stable version and keeps `tailwind.config.js` in JS, which lets the tokens come
from a shared file (§5). Tailwind v4 moves the tokens to `@theme` in CSS, which
would break that single source.

**React Navigation, not Expo Router** — explicit, typed routes in
`src/navigation/`, without coupling the folder structure to navigation (§6).

**axios, not a hand-rolled `fetch`.** `baseURL`, timeout and cancellation come
from the instance, and the two interceptors — bearer token on the way out,
translation to `ApiError` on the way back — replace the hand-written client that
used to exist. The colocated test swaps `defaults.adapter` instead of forcing
the `fetch` adapter: in React Native the default adapter is XHR, and testing
against another would be testing a network stack the app does not use.

**The toast is our own component, not a lib.** No popular React Native toast
lib styles through `className` — they all use `StyleSheet`/props — so using the
semantic tokens would require passing a custom render component, that is,
writing the visuals the same way **and** carrying the dependency. What is left
for us is one slot, one timer and one fade.

**Core `Animated`, not Reanimated,** for that 200ms fade. Reanimated is
installed (NativeWind v4 requires it), but using it here would bring its mock
into the toast tests with nothing in return: it earns its place in
gesture-driven interaction at 60fps, not in an opacity transition.

**A route name is a literal, not a constant** (§6), which makes the param list
the single declaration of each name. Since those names are PascalCase by React
Navigation convention, `biome.json` allows PascalCase `typeProperty` for
`**/navigation/types.ts` — same nature as the `tokens.js` exemption: the shape
of the key is dictated by the library, not chosen by us.

**Biome, not ESLint + Prettier.** One binary, one config, one pass — no plugin
matrix to keep in sync across the apps that clone this repo. It is also what
gives two conventions teeth directly (§4): components as arrow functions and no
magic numbers.

**`noUncheckedIndexedAccess` on** — indexed access returns `T | undefined`.
Stricter, and it catches real array/record access bugs.

---

## 10. What does not exist yet

Listed so it is not mistaken for an omission, without detailing what was not
built:

Google sign-in (`POST /auth/google`, deferred until the first app nears
release) · `src/hooks/`, `src/store/` (created only when something needs them,
§1) · telemetry and crash reporting (no sink: the error layer reports nowhere) ·
toast queue, swipe to dismiss and per-screen boundary · E2E flow · cookie transport on the web target (the app always asks for
`refreshTransport: 'body'`, and without a cookie `storage.web.ts` keeps the
refresh token in `localStorage` — which is why it aborts at boot outside
`__DEV__`: web is a development convenience, not a production surface) ·
proactive refresh scheduled by the JWT's `exp` · ending a specific session (the
API only exposes the listing, not per-device revocation).

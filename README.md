# React Native Boilerplate

Reusable base for React Native apps. **This is not a finished app** — it is
the starting point that other projects clone.

**Stack:** Expo SDK 57 (managed) · React Native 0.86 · TypeScript · NativeWind v4
(Tailwind 3.4) · React Navigation 7 · TanStack Query 5 · axios ·
react-hook-form + zod · expo-secure-store · Biome · pnpm

**Status:** structure, tooling and conventions are ready, plus the `auth` module
implemented against thirteen of the fourteen `/auth` endpoints of
`api-clean-platform`: sign-up with email verification, sign-in, password
recovery and change, refresh token rotation, session restore on boot, sign-out
on this device or on all of them, active sessions, account deletion and a
navigation gate. Only Google sign-in is deferred. There is also an error
layer: a render error boundary, a global toast for failures with no owning
screen, shared copy keyed by `code`, and queries that pause when the device
goes offline. Dark mode is implemented: CSS variables applied at runtime by
`ThemeProvider`, with the app following the system theme by default and a
manual override (`light`/`dark`/`system`) that the user switches on the
account screen.

> **Code conventions** (how to write) are in **[AGENTS.md](AGENTS.md)**.
> **Architecture** (what exists, module boundaries, locked decisions and
> what is still missing) is in **[ARCHITECTURE.md](ARCHITECTURE.md)**. Read
> both before contributing.

---

## Getting started

Requires pnpm. If you don't have it: `corepack enable pnpm`.

```bash
pnpm install
cp .env.example .env    # and adjust EXPO_PUBLIC_API_URL if the API is not on localhost:3000
pnpm start          # Metro — opens Expo Go / dev tools
pnpm android        # opens on the Android emulator/device via Expo Go
pnpm ios            # opens on the iOS simulator via Expo Go (macOS only)
pnpm web            # opens in the browser
```

Quality checks:

```bash
pnpm check              # typecheck + lint — run before every commit
pnpm typecheck          # tsc --noEmit
pnpm lint               # biome check
pnpm lint:fix           # biome check --write (safe fixes)
pnpm format             # biome format --write
pnpm test               # jest --watchAll --coverage
pnpm test:ci            # jest --ci --coverage
```

---

## Folder structure

Organised **by module, not by file type**. A new module is a new self-contained
folder in `src/modules/`, with its own public API, screens, components and
hooks. Every module has its own `README.md` documenting what it exports — see
[`src/modules/README.md`](src/modules/README.md) for the full details of the
conventions.

```
App.tsx              root: providers + navigation
biome.json            linter + formatter (replaces ESLint and Prettier)
tailwind.config.js    reads the tokens from src/theme/tokens.js
src/
  components/          UI primitives (inputs, FormField, FormScreen, SubmitButton)
  config/               environment variables, validated on load
  errors/               error classification, copy, toast, boundary, the app's QueryClient
  lib/                  HTTP client and connectivity — I/O without React
  screens/              screens without a module of their own
  navigation/           React Navigation: stack, routes, param types
  modules/              one module per folder — see src/modules/README.md
  theme/                design tokens (single source of truth)
  utils/                pure helpers (classnames)
```

Nothing outside a module imports a file from inside it — only what its
`index.ts` exports — and modules do not import each other. Shared code
moves up to `src/components/` (from the second consumer on) or to a
top-level module such as `src/hooks/`, `src/lib/` or `src/store/`, created
only when something actually needs them — see [AGENTS.md](AGENTS.md) for the
purpose of each.

The full tree as it is today, with the role of each file, and the table of the
module boundary rule are in [ARCHITECTURE.md](ARCHITECTURE.md),
section 2.

---

## Design tokens

`src/theme/tokens.js` is the **single source of truth**. It is CommonJS on
purpose: the same file feeds `tailwind.config.js` (Node) and the TypeScript
code (through `src/theme/index.ts`, with the types inferred from the file
itself), so a token never diverges between the two.

The values are CSS strings (`'16px'`) because NativeWind compiles Tailwind
to CSS before converting to native styles. To use a token outside
Tailwind:

```ts
import { parsePixels, spacing, useThemeColors } from '@/theme';

const theme = useThemeColors();

<ActivityIndicator color={theme.primary} size={parsePixels(spacing[6])} />;
```

### Raw vs. semantic colours

Prefer the semantic aliases in screens:

| Use this                             | Instead of this      |
| ------------------------------------ | -------------------- |
| `bg-background`, `bg-surface`        | `bg-neutral-50`      |
| `text-content`, `text-content-muted` | `text-neutral-900`   |
| `bg-primary`                         | `bg-brand-500`       |
| `border-border`                      | `border-neutral-200` |

Rebranding and dark mode then happen in a single place
(`semanticColors`/`semanticColorsDark`) — no screen needs to be touched. The
app follows the system theme by default, with a manual override saved by the
user. See [ARCHITECTURE.md](ARCHITECTURE.md), section 5.

### Adapting to a new app

1. Replace the `colors.brand` scale in `src/theme/tokens.js`.
2. Review `semanticColors` and `semanticColorsDark` if the brand needs
   different surfaces or contrast in the two themes.
3. For a custom font: load it with `expo-font`, then set `typography.fontFamily.sans`.
4. Update `name` and `slug` in `app.json`, and `name` in `package.json`. Also
   set `ios.bundleIdentifier`, `android.package` and `scheme` — the boilerplate
   deliberately ships no value for them (each app has its own), and without
   them there is no release build or deep link.

No screen needs to be touched. Why `tokens.js` is CommonJS and the styling
rule (NativeWind only, no `StyleSheet`) are detailed in
[ARCHITECTURE.md](ARCHITECTURE.md), section 5.

---

## Decisions and rationale

The locked decisions — why Biome instead of ESLint + Prettier, why pnpm with
`hoisted`, why NativeWind v4 and not v5, why React Navigation and not Expo
Router, `noUncheckedIndexedAccess`, no Tailwind class sorting, why no JS
obfuscation — and the rationale for each live in
[ARCHITECTURE.md](ARCHITECTURE.md), section 9. Kept only there so there are
never two explanations that could diverge.

---

## Current state of navigation

See [ARCHITECTURE.md](ARCHITECTURE.md), section 6 — the composition root that
lists modules instead of screens, and the gate that chooses between the
signed-in and the signed-out stack.

---

## Roadmap

> What is left to implement is tracked here as progress; the same content
> appears in [ARCHITECTURE.md](ARCHITECTURE.md), section 10, as a record of
> "this does not exist yet, it is not an omission" — the two serve different
> purposes, but describe the same gap.

- [x] **Setup** — Expo + TS, NativeWind + tokens, folder structure,
      React Navigation, README.
- [x] **Standards** — Biome replaces ESLint/Prettier, pnpm, project
      conventions in `AGENTS.md`, English-only code, a README per module,
      no magic strings or numbers, unit tests with jest-expo +
      React Native Testing Library. No E2E for now — Maestro was
      removed because it requires Android Studio/iOS Simulator configured
      locally.
- [x] **Auth** — module in `src/modules/auth/` against `api-clean-platform`:
      HTTP client (axios) in `src/lib/`, `useAuth()` / `AuthProvider`,
      rotating refresh token in `expo-secure-store` (the access token lives
      only in memory), single-flight refresh with automatic retry of the
      request that failed, sign-out on this device and on all of them, three-step
      sign-up with email verification, password recovery and change, active
      sessions, account deletion, and conditional navigation between the
      signed-in and the signed-out stack. Only Google sign-in is missing,
      deferred.
- [x] **Theme** — design tokens in `src/theme/tokens.js` (single source for
      Tailwind and TypeScript), dark mode via CSS variables applied at runtime
      by `ThemeProvider`, system theme by default with a persisted manual
      override (`useThemePreference`) switched on the account screen.
- [ ] **Polish** — boilerplate adoption guide.

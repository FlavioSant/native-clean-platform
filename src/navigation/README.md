# Navigation

React Navigation setup: the stacks, the route names and their param types.
Navigation lives here and nowhere else — no folder-based routing, so adding a
screen is always an explicit edit.

This module lists **modules, not screens**: a module's screens live in its own
`navigation/`.

## Components

| Name            | Description                                                        |
| --------------- | -------------------------------------------------------------------- |
| `RootNavigator` | Shows the `SplashScreen` while the session is unknown and only then mounts the `NavigationContainer`. |
| `RootStack`     | One `Stack.Screen` per module. Renders only the side the session picks. |
| `AppStack`      | The signed-in shell: `Home` plus the `auth` module's `AccountStack`, registered as **one** screen. |

## Types

| Name                 | Description                                                          |
| -------------------- | ---------------------------------------------------------------------- |
| `RootStackParamList` | Params of the top-level routes (`Auth`, `App`). Registered globally so `navigate()` is typed everywhere. |
| `AppStackParamList`  | Params of each route in `AppStack`.                                   |

## Current state

`RootNavigator` shows the `SplashScreen` while the session is unknown
(`AUTH_STATUSES.LOADING`) and only then mounts the `NavigationContainer`. The
`RootStack` renders **only one side**: `AuthStack` when signed out, `AppStack`
when signed in. Rendering only one side — instead of registering both and
navigating — is what stops the Android back button, with no history, from
returning to a signed-in screen after logout.

This module lists **modules, not screens**. Adding a screen to a module touches
only that module's `navigation/`. Adding a new module touches its
`navigation/` plus one line here in `types.ts` and another in `RootStack.tsx`.

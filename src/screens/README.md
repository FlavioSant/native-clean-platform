# Screens

Screens that do not belong to any specific module. A screen is the component
a route renders; it composes modules' components and has no business logic of
its own.

A module's screens live in `src/modules/<name>/screens/`, and are imported by
the stack.

## Components

| Name           | Route  | Description                                              |
| -------------- | ------ | ---------------------------------------------------------- |
| `HomeScreen`   | `Home` | Home screen. Leads to the account area, which is where the session exits live. |
| `SplashScreen` | —      | No route of its own: `RootNavigator` renders it directly, outside the `NavigationContainer`, while the boot session is still unknown. |

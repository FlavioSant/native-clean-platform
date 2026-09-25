# Theme

Design tokens para o app inteiro, mais o mecanismo de dark mode. `tokens.js`
é a fonte única da verdade e é propositalmente CommonJS: o mesmo arquivo
alimenta o `tailwind.config.js` (Node) e o código TypeScript, então um token
nunca diverge entre os dois.

Não há `.d.ts` escrito à mão: o TypeScript infere os tipos do próprio
`tokens.js` (`allowJs`), então um degrau de escala que não existe —
`colors.brand[5000]`, `colors.success[100]` — é erro de compilação, e um
tipo escrito à mão não tem como ficar defasado em relação ao arquivo.
`index.ts` reexporta para o código do app.

## Components

| Name | Description |
| ---- | ------------- |
| `ThemeProvider` | Aplica o tema ativo no app inteiro via `vars()` do NativeWind numa `View` raiz, e dispara o efeito de boot do `useThemePreference`. Montado em `App.tsx`, dentro do `GestureHandlerRootView`. |

## Hooks

| Name | Description |
| ---- | ------------- |
| `useThemeColors()` | O mapa semântico ativo (`semanticColors` ou `semanticColorsDark`), para o raro caso que precisa de um valor literal fora do NativeWind — uma cor de `ActivityIndicator`, por exemplo. |
| `useThemePreference()` | `{ preference, setPreference }`. `preference` é `'system' \| 'light' \| 'dark'` — a escolha do usuário, não o valor resolvido (o `colorScheme` do NativeWind só devolve o resolvido). Hidrata do `AsyncStorage` no mount e aplica via `colorScheme.set()`; `setPreference` grava e aplica na mesma chamada. |

## Constants

| Name             | Description                                                          |
| ---------------- | ---------------------------------------------------------------------- |
| `colors`         | Escalas brutas: `brand` e `neutral` (50→950), mais `success`, `warning`, `danger`, `info`. |
| `semanticColors` | Aliases por papel no tema claro: `background`, `surface`, `content`, `primary`, `border`, `danger`, … |
| `THEME_PREFERENCES` | `system` \| `light` \| `dark` — os três valores de `useThemePreference().preference`. |
| `spacing`        | Grid de 4pt, como strings CSS.                                        |
| `typography`     | `fontFamily`, `fontSize` (com line heights), `fontWeight`.            |
| `radius`         | Escala de border radius.                                              |

## Functions

| Name              | Description                                                        |
| ----------------- | ------------------------------------------------------------------ |
| `parsePixels(value)` | Converte um token CSS (`'16px'`) para o número que as APIs nativas esperam (`16`). |

## Types

| Name     | Description                        |
| -------- | ------------------------------------ |
| `Tokens` | Formato do objeto de tokens inteiro, inferido de `tokens.js`. |
| `ThemePreference` | União derivada de `THEME_PREFERENCES`. |

## Adapting to a new app

1. Substitua a escala `colors.brand`.
2. Revise `semanticColors` e `semanticColorsDark` se a marca precisar de
   superfícies ou contraste diferentes nos dois temas.
3. Para uma fonte customizada: carregue com `expo-font`, depois defina `typography.fontFamily.sans`.

Nenhuma tela precisa ser tocada.

# Navigation

Setup do React Navigation: os stacks, os nomes de rota e seus tipos de
parâmetro. A navegação vive aqui e em nenhum outro lugar — sem roteamento
baseado em pastas, então adicionar uma tela é sempre uma edição explícita.

Este módulo lista **módulos, não telas**: as telas de um módulo ficam no
`navigation/` dele.

## Components

| Name            | Description                                                        |
| --------------- | -------------------------------------------------------------------- |
| `RootNavigator` | Mostra o `SplashScreen` enquanto a sessão é desconhecida e só então monta o `NavigationContainer`. |
| `RootStack`     | Um `Stack.Screen` por módulo. Renderiza só o lado que a sessão escolhe. |
| `AppStack`      | O shell logado: a `Home` mais o `AccountStack` do módulo `auth`, registrado como **uma** tela. |

## Types

| Name                 | Description                                                          |
| -------------------- | ---------------------------------------------------------------------- |
| `RootStackParamList` | Parâmetros das rotas de topo (`Auth`, `App`). Registrado globalmente para que `navigate()` seja tipado em todo lugar. |
| `AppStackParamList`  | Parâmetros de cada rota em `AppStack`.                                |

## Current state

`RootNavigator` mostra o `SplashScreen` enquanto a sessão é desconhecida
(`AUTH_STATUSES.LOADING`) e só então monta o `NavigationContainer`. O
`RootStack` renderiza **um lado só**: `AuthStack` quando deslogado, `AppStack`
quando logado. Renderizar só um lado — em vez de registrar os dois e navegar —
é o que deixa o botão voltar do Android sem histórico para retornar a uma tela
logada depois do logout.

Este módulo lista **módulos, não telas**. Adicionar uma tela a um módulo toca
apenas o `navigation/` daquele módulo. Adicionar um módulo novo toca o
`navigation/` dele mais uma linha aqui em `types.ts` e outra em `RootStack.tsx`.

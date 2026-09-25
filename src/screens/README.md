# Screens

Telas que não pertencem a nenhum módulo específico. Uma tela é o componente
que uma rota renderiza; ela compõe componentes de módulos e não tem lógica
de negócio própria.

Telas de um módulo vivem em `src/modules/<name>/screens/`, e são
importadas pelo stack.

## Components

| Name           | Route  | Description                                              |
| -------------- | ------ | ---------------------------------------------------------- |
| `HomeScreen`   | `Home` | Tela inicial. Leva à área de conta, que é onde vivem as saídas de sessão. |
| `SplashScreen` | —      | Sem rota própria: o `RootNavigator` a renderiza direto, fora do `NavigationContainer`, enquanto a sessão do boot ainda é desconhecida. |

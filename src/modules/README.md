# Modules

Organizado **por módulo, não por tipo de arquivo**. Cada pasta aqui é um
módulo autocontido — telas, hooks, chamadas de API, tipos — que expõe sua
superfície pública através de um `index.ts`.

```
modules/<name>/
  api/          chamadas ao backend deste módulo
  components/   componentes específicos deste módulo
  context/      os React Contexts deste módulo, cada um com seu provider
  hooks/        hooks específicos deste módulo
  navigation/   o navigator deste módulo e os tipos de parâmetro das suas rotas
  screens/      telas pertencentes a este módulo
  utils/        helpers puros deste módulo — sem React, sem I/O
  validations/  schemas de validação dos formulários deste módulo
  constants.ts  constantes compartilhadas dentro do módulo
  types.ts
  index.ts      o ÚNICO ponto de entrada que outros módulos podem importar
  README.md     obrigatório — veja AGENTS.md, inclui uma seção `## Flow` com
                diagrama Mermaid (telas → hooks → API, e conexão com fora)
```

## Modules

| Name   | Description                                                          |
| ------ | ---------------------------------------------------------------------- |
| `auth` | Sessão do app: cadastro, login, restauração no boot, logout e o estado que a navegação consulta. |

# Lib

Integrações com o mundo externo que não pertencem a nenhum módulo. Hoje só a
API. **Nada aqui conhece React** — sem hooks, sem contextos, sem componentes —
e nada aqui conhece módulo de domínio: quando o cliente precisa de algo que só
um módulo sabe (o token da sessão), ele expõe um ponto de registro e o módulo
se registra nele.

## Constants (objeto)

| Name  | Description |
| ----- | ------------- |
| `api` | `{ get, post, patch, delete }` — um método por verbo, cada um `(path, body?) => Promise<T>`. Único ponto de entrada do cliente. |

## Functions

| Name                           | Description                                                     |
| ------------------------------ | ---------------------------------------------------------------- |
| `configureAuthorization(h)`    | Registra `{ getAccessToken, refreshAccessToken }`. Passe `null` para desregistrar. |
| `startConnectivityWatch()`     | Liga o NetInfo ao `onlineManager` do TanStack Query. Chamado uma vez pelo `App.tsx`. |
| `parseOrThrow(schema, payload)` | Valida a resposta de qualquer endpoint contra um schema Zod e devolve o dado tipado; num drift, lança `ApiError` com `UNEXPECTED_RESPONSE`. Único, para que todo módulo trate contrato quebrado do mesmo jeito. |

## Constants

| Name                    | Description                                                       |
| ----------------------- | ------------------------------------------------------------------ |
| `API_ERROR_CODES`       | Os códigos de erro da API, copiados do `api-clean-platform`, mais dois do próprio cliente (`NETWORK_ERROR`, `UNEXPECTED_RESPONSE`). |
| `UNAUTHORIZED_STATUS`   | `401` — o status que o cliente e o `classifyError` de `@/errors` comparam. |
| `CLIENT_FAILURE_STATUS` | `0` — não houve status HTTP: a falha foi deste lado do fio.        |

## Types

| Name                    | Description                                              |
| ----------------------- | --------------------------------------------------------- |
| `ApiError`              | Erro com `status`, `code`, `details` e `traceId`.          |
| `ApiErrorCode`          | União derivada de `API_ERROR_CODES`.                       |
| `ValidationDetail`      | Um item de `details[]` numa resposta 400.                  |
| `ErrorEnvelope`         | O formato de erro que a API sempre devolve.                |
| `AuthorizationHandlers` | O par de callbacks que liga o cliente à sessão.            |

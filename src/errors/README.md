# Errors

Uma resposta só para "o que acontece quando algo falha": classificação do erro,
a copy que o usuário lê, o error boundary de render e o toast global.

## Components

| Name | Description |
| ---- | ------------- |
| `ErrorBoundary` | Contém uma exceção de render e mostra uma tela de fallback com "tentar de novo". |
| `ErrorToastProvider` | Segura o toast e se registra como reporter global enquanto está montado. |

## Hooks

| Name | Description |
| ---- | ------------- |
| `useErrorToast()` | `{ showError }`. Lança se usado fora do `ErrorToastProvider`. |

## Functions

| Name | Description |
| ---- | ------------- |
| `classifyError(error)` | Devolve o `ErrorKind` do erro. |
| `isRetryable(error)` | `true` só para `offline` e `server`. |
| `shouldRetry(failureCount, error)` | No formato que a opção `retry` do TanStack Query espera. |
| `copyForError(error)` | A frase que o usuário lê, escolhida pelo `code`. |
| `registerErrorCopy(entries)` | Registra a copy de domínio de um módulo. Chamado pelo `App.tsx`. |
| `resetErrorCopy()` | Só para testes, para um registro não vazar de um arquivo para outro. |
| `configureErrorReporter(fn)` | Registra quem exibe o erro. `null` desregistra. |
| `reportError(error)` | Entrega o erro a quem estiver registrado. No-op se não houver ninguém. |
| `createQueryClient(overrides?)` | Monta o `QueryClient` do app: retry via `shouldRetry`, `staleTime` de 30 s, reporte global de erro de query e `networkMode: 'always'` nas mutations. `overrides` (`{ queries, mutations }`) existe para testes. |
| `applyServerFieldErrors(error, setError, fields)` | Põe os `details[]` de um `ApiError` no campo do react-hook-form que os renderiza. `fields` é uma allowlist. |

## Constants

| Name | Description |
| ---- | ------------- |
| `ERROR_KINDS` | `offline` \| `server` \| `input` \| `session` \| `unexpected`. |

## Types

| Name | Description |
| ---- | ------------- |
| `ErrorKind` | União derivada de `ERROR_KINDS`. |
| `ErrorReporter` | Formato de quem `configureErrorReporter` registra. |
| `ErrorToastValue` | O que `useErrorToast()` devolve. |

## Limites aceitos

- **Um boundary só, na raiz.** Um crash de tela apaga o app inteiro, não só a
  tela. Preservar a navegação exigiria um segundo boundary dentro do navigator —
  fica para quando houver mais de um stack para preservar.
- **"Tentar de novo" só remonta.** Se o erro for determinístico, ele volta. É o
  que todo boundary faz; fingir o contrário seria pior.
- **Um slot, não fila.** Erro novo substitui o anterior. Erros em rajada quase
  sempre têm a mesma causa.
- **A dispensa é assíncrona.** A mensagem some no callback que encerra o fade,
  não no toque — um teste que afirme o contrário falha por motivo errado.

## Não existe ainda

Telemetria de qualquer tipo, swipe para dispensar, toast com ação, boundary por
tela, e captura de rejeição de promise fora do TanStack Query. O desenho está em
`docs/superpowers/specs/2026-09-02-error-layer-design.md`.

- **`TOO_MANY_REQUESTS` ganhou copy, e o `classify.ts` não mudou.** Um `429` já
  cai em `INPUT` pela checagem de status, e `INPUT` não é retentável — que é o
  comportamento certo, já que repetir é o que produziu o rate limit. A única
  lacuna real era o `copyForError` cair no texto genérico, e ela se fecha com
  uma entrada no `BASE_COPY`. Um `ErrorKind` novo não pagaria nada.
- **O `Retry-After` do `429` é ignorado de propósito.** Renderizar uma contagem
  a partir dele significa um relógio, um loop de re-render e uma segunda fonte
  de verdade ao lado do cooldown de reenvio, por um header sobre o qual o
  usuário não pode agir de forma diferente de "tente daqui a pouco".

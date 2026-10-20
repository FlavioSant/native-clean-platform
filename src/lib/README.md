# Lib

Integrations with the outside world that do not belong to any module. Today
only the API. **Nothing here knows React** — no hooks, no contexts, no
components — and nothing here knows a domain module: when the client needs
something only a module knows (the session token), it exposes a registration
point and the module registers itself there.

## Constants (object)

| Name  | Description |
| ----- | ------------- |
| `api` | `{ get, post, patch, delete }` — one method per verb, each `(path, body?) => Promise<T>`. The client's single entry point. |

## Functions

| Name                           | Description                                                     |
| ------------------------------ | ---------------------------------------------------------------- |
| `configureAuthorization(h)`    | Registers `{ getAccessToken, refreshAccessToken }`. Pass `null` to unregister. |
| `startConnectivityWatch()`     | Connects NetInfo to TanStack Query's `onlineManager`. Called once by `App.tsx`. |
| `parseOrThrow(schema, payload)` | Validates any endpoint's response against a Zod schema and returns the typed data; on drift, throws an `ApiError` with `UNEXPECTED_RESPONSE`. A single one, so every module handles a broken contract the same way. |

## Constants

| Name                    | Description                                                       |
| ----------------------- | ------------------------------------------------------------------ |
| `API_ERROR_CODES`       | The API's error codes, copied from `api-clean-platform`, plus two from the client itself (`NETWORK_ERROR`, `UNEXPECTED_RESPONSE`). |
| `UNAUTHORIZED_STATUS`   | `401` — the status the client and `@/errors`' `classifyError` compare against. |
| `CLIENT_FAILURE_STATUS` | `0` — there was no HTTP status: the failure was on this side of the wire. |

## Types

| Name                    | Description                                              |
| ----------------------- | --------------------------------------------------------- |
| `ApiError`              | Error with `status`, `code`, `details` and `traceId`.      |
| `ApiErrorCode`          | Union derived from `API_ERROR_CODES`.                      |
| `ValidationDetail`      | An item of `details[]` in a 400 response.                  |
| `ErrorEnvelope`         | The error shape the API always returns.                    |
| `AuthorizationHandlers` | The pair of callbacks that connects the client to the session. |

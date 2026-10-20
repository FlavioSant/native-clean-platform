# Errors

A single answer to "what happens when something fails": error classification,
the copy the user reads, the render error boundary and the global toast.

## Components

| Name | Description |
| ---- | ------------- |
| `ErrorBoundary` | Contains a render exception and shows a fallback screen with "try again". |
| `ErrorToastProvider` | Holds the toast and registers itself as the global reporter while mounted. |

## Hooks

| Name | Description |
| ---- | ------------- |
| `useErrorToast()` | `{ showError }`. Throws if used outside the `ErrorToastProvider`. |

## Functions

| Name | Description |
| ---- | ------------- |
| `classifyError(error)` | Returns the error's `ErrorKind`. |
| `isRetryable(error)` | `true` only for `offline` and `server`. |
| `shouldRetry(failureCount, error)` | In the shape TanStack Query's `retry` option expects. |
| `copyForError(error)` | The sentence the user reads, chosen by `code`. |
| `registerErrorCopy(entries)` | Registers a module's domain copy. Called by `App.tsx`. |
| `resetErrorCopy()` | For tests only, so a registry does not leak from one file to another. |
| `configureErrorReporter(fn)` | Registers whoever displays the error. `null` unregisters. |
| `reportError(error)` | Hands the error to whoever is registered. A no-op if no one is. |
| `createQueryClient(overrides?)` | Builds the app's `QueryClient`: retry via `shouldRetry`, a 30 s `staleTime`, global reporting of query errors and `networkMode: 'always'` on mutations. `overrides` (`{ queries, mutations }`) exists for tests. |
| `applyServerFieldErrors(error, setError, fields)` | Puts an `ApiError`'s `details[]` on the react-hook-form field that renders them. `fields` is an allowlist. |

## Constants

| Name | Description |
| ---- | ------------- |
| `ERROR_KINDS` | `offline` \| `server` \| `input` \| `session` \| `unexpected`. |

## Types

| Name | Description |
| ---- | ------------- |
| `ErrorKind` | Union derived from `ERROR_KINDS`. |
| `ErrorReporter` | Shape of whatever `configureErrorReporter` registers. |
| `ErrorToastValue` | What `useErrorToast()` returns. |

## Accepted limits

- **One boundary, at the root.** A screen crash wipes out the whole app, not
  just the screen. Preserving navigation would require a second boundary inside
  the navigator — left for when there is more than one stack to preserve.
- **"Try again" only remounts.** If the error is deterministic, it comes back.
  That is what every boundary does; pretending otherwise would be worse.
- **One slot, not a queue.** A new error replaces the previous one. Bursts of
  errors almost always share the same cause.
- **Dismissal is asynchronous.** The message disappears in the callback that
  ends the fade, not on touch — a test asserting otherwise fails for the wrong
  reason.

## Does not exist yet

Telemetry of any kind, swipe to dismiss, a toast with an action, a per-screen
boundary, and capturing promise rejections outside TanStack Query.

- **`TOO_MANY_REQUESTS` gained copy, and `classify.ts` did not change.** A `429`
  already falls into `INPUT` through the status check, and `INPUT` is not
  retryable — which is the right behaviour, since retrying is what produced the
  rate limit. The only real gap was `copyForError` falling back to the generic
  text, and it closes with one entry in `BASE_COPY`. A new `ErrorKind` would not
  pay for itself.
- **The `429`'s `Retry-After` is ignored on purpose.** Rendering a countdown
  from it means a clock, a re-render loop and a second source of truth next to
  the resend cooldown, for a header on which the user cannot act any differently
  than "try again in a bit".

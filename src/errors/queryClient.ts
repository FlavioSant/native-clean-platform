import { type DefaultOptions, MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { shouldRetry } from './classify';
import { reportError } from './reporter';

declare module '@tanstack/react-query' {
  interface Register {
    queryMeta: {
      /** Opts a query out of the global toast — it renders its own failure. */
      silent?: boolean;
    };
    mutationMeta: {
      /** Opts a mutation IN to the global toast — off by default, see `createQueryClient`. */
      toastOnError?: boolean;
    };
  }
}

const QUERY_STALE_TIME_MS = 30000;

/**
 * The app's one server-state client policy, built here so `App.tsx` and the
 * tests configure the same thing.
 *
 * Queries report by default — a background query has no call site to show its
 * failure. Mutations do not: a form already renders its submit error inline,
 * and toasting it too would say the same thing twice.
 *
 * Every mutation runs with `networkMode: 'always'`. TanStack's default PAUSES a
 * mutation while the device is offline, so a submit would hang forever instead
 * of failing where the form can show it. Queries keep the pausing default, and
 * the two that gate the UI opt out individually (`meQuery`, `useSessions`).
 *
 * `overrides` exist for tests, which turn retries and garbage collection off
 * so a run neither waits on backoff nor leaves a `gcTime` timer — queries and
 * mutations each have their own — holding the process open.
 */
export const createQueryClient = (overrides: DefaultOptions = {}): QueryClient =>
  new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        if (query.meta?.silent !== true) {
          reportError(error);
        }
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        if (mutation.meta?.toastOnError === true) {
          reportError(error);
        }
      },
    }),
    defaultOptions: {
      queries: { retry: shouldRetry, staleTime: QUERY_STALE_TIME_MS, ...overrides.queries },
      mutations: { networkMode: 'always', ...overrides.mutations },
    },
  });

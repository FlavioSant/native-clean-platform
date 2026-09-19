import { queryOptions, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { reportError } from '@/errors';
import { configureAuthorization } from '@/lib';

import { fetchMe, refreshSession } from '../api/authApi';
import type { SessionTokens, User } from '../api/schemas';
import { AUTH_QUERY_KEYS } from '../constants';
import { clearRefreshToken, readRefreshToken, writeRefreshToken } from '../storage';
import type { AuthStatus } from '../types';
import { isEndedSession, resolveStatus } from '../utils/session';
import { createSingleFlight } from '../utils/singleFlight';

/** A rejected token will be rejected again; retrying only delays the boot. */
const ME_RETRY_COUNT = 0;

/**
 * Shared by the `meQuery` observer and the imperative fetch in `openSession`:
 * each has its own defaults and would not inherit the other's options.
 *
 * `networkMode: 'always'` because the client default pauses a query while
 * offline, so it never reaches isSuccess or isError. The boot gate below waits
 * for one of those, and would trap the app on the splash screen for as long as
 * the device stays offline.
 */
const meQueryOptions = queryOptions({
  queryKey: AUTH_QUERY_KEYS.ME,
  queryFn: fetchMe,
  networkMode: 'always',
});

export interface AuthSessionValue {
  status: AuthStatus;
  user: User | null;
  /** Persists the refresh token and applies the access token. No profile fetch. */
  adoptTokens: (tokens: SessionTokens) => Promise<void>;
  /** `adoptTokens`, then puts the profile in the cache before resolving. */
  openSession: (tokens: SessionTokens) => Promise<void>;
  endSession: () => Promise<void>;
}

/**
 * Everything that decides whether there is a session: the token, the boot that
 * restores one, the single-flight refresh that keeps it, and the profile query
 * that says whether the token still verifies. What a user DOES with one is
 * `useAuthActions`.
 */
export const useAuthSession = (): AuthSessionValue => {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(null);
  const [hasCompletedBoot, setHasCompletedBoot] = useState(false);
  // The registered `getAccessToken` has to read the CURRENT token without the
  // effect below re-running on every change, so state and ref move together.
  const tokenRef = useRef<string | null>(null);
  // Bumped by every `endSession`. A refresh that started under an earlier
  // value belongs to a session the user has since ended, and must not revive it.
  const sessionEpochRef = useRef(0);

  const applyToken = useCallback((next: string | null) => {
    tokenRef.current = next;
    setToken(next);
  }, []);

  const meQuery = useQuery({ ...meQueryOptions, enabled: token !== null, retry: ME_RETRY_COUNT });

  const endSession = useCallback(async () => {
    sessionEpochRef.current += 1;
    applyToken(null);
    await clearRefreshToken();
    queryClient.removeQueries({ queryKey: AUTH_QUERY_KEYS.ME });
    // Not only the profile: the next account to sign in on this device would
    // otherwise see this one's session list until its own refetch landed.
    queryClient.removeQueries({ queryKey: AUTH_QUERY_KEYS.SESSIONS });
  }, [applyToken, queryClient]);

  /**
   * Persist first, then apply. The token just spent must not survive a relaunch,
   * and a process death in this gap leaves a spent token on disk — which is
   * exactly what the API's 30-second grace window exists to forgive.
   */
  const adoptTokens = useCallback(
    async ({ accessToken, refreshToken }: SessionTokens) => {
      await writeRefreshToken(refreshToken);
      applyToken(accessToken);
    },
    [applyToken],
  );

  /**
   * `query`, not an invalidation: the user has to be in the cache before
   * this resolves, so the gate swaps in the same tick the screen stops
   * submitting.
   */
  const openSession = useCallback(
    async (tokens: SessionTokens) => {
      await adoptTokens(tokens);
      await queryClient.query(meQueryOptions);
    },
    [adoptTokens, queryClient],
  );

  /**
   * The only place a refresh happens, once at a time (`createSingleFlight`: the
   * API keeps only the last of two concurrent rotations). Its three answers are
   * the `AuthorizationHandlers.refreshAccessToken` contract in `@/lib`.
   */
  const refreshAccessToken = useMemo(
    () =>
      createSingleFlight(async (): Promise<string | null> => {
        const epoch = sessionEpochRef.current;
        const isSuperseded = () => sessionEpochRef.current !== epoch;
        const stored = await readRefreshToken();

        if (isSuperseded()) {
          return null;
        }

        if (stored === null) {
          await endSession();

          return null;
        }

        try {
          const tokens = await refreshSession(stored);

          // Answered for a session that ended while the request was in flight.
          // `null` is already the "session is over" answer callers understand.
          if (isSuperseded()) {
            return null;
          }

          await adoptTokens(tokens);

          // The keychain write above is itself an await, and a sign-out can land
          // inside it and lose the race for the token it was clearing.
          if (isSuperseded()) {
            await endSession();

            return null;
          }

          return tokens.accessToken;
        } catch (error) {
          // Offline, or a 503 the API could not retry away: the caller owns it,
          // and the session stays exactly as it was.
          if (!isEndedSession(error)) {
            throw error;
          }

          // A newer session must not be torn down for the death of an older one.
          if (isSuperseded()) {
            return null;
          }

          await endSession();

          return null;
        }
      }),
    [adoptTokens, endSession],
  );

  useEffect(() => {
    configureAuthorization({
      getAccessToken: () => tokenRef.current,
      refreshAccessToken,
    });

    return () => configureAuthorization(null);
  }, [refreshAccessToken]);

  // Boot: spend whatever refresh token storage holds, exactly once.
  useEffect(() => {
    let isMounted = true;

    const restore = async () => {
      const stored = await readRefreshToken();

      if (!isMounted) {
        return;
      }

      if (stored === null) {
        setHasCompletedBoot(true);

        return;
      }

      try {
        const accessToken = await refreshAccessToken();

        if (!isMounted) {
          return;
        }

        // A token hands boot over to `meQuery`; null means the runner already
        // cleared the session, so there is nothing left to wait for.
        if (accessToken === null) {
          setHasCompletedBoot(true);
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        // Not a TanStack Query call, so the global QueryCache callback that
        // toasts a failed boot cannot see this one. Without this the user would
        // land on the sign-in screen with no explanation.
        reportError(error);
        setHasCompletedBoot(true);
      }
    };

    restore();

    return () => {
      isMounted = false;
    };
  }, [refreshAccessToken]);

  // Boot ends when the restored token has been answered for, either way.
  useEffect(() => {
    if (hasCompletedBoot) {
      return;
    }
    if (meQuery.isSuccess || meQuery.isError) {
      setHasCompletedBoot(true);
    }
  }, [hasCompletedBoot, meQuery.isSuccess, meQuery.isError]);

  // A token the API rejected must not survive in the keychain. Only a rejected
  // token, though: being offline at launch is no reason to make the user type
  // their password again on the next one.
  useEffect(() => {
    const endRejectedSession = async () => {
      try {
        await endSession();
      } catch (error) {
        // The in-memory session is already gone; only the keychain delete
        // failed, and the next boot's refresh gets the same rejection and
        // retries it. Nothing else is listening to this promise.
        reportError(error);
      }
    };

    if (tokenRef.current !== null && isEndedSession(meQuery.error)) {
      endRejectedSession();
    }
  }, [meQuery.error, endSession]);

  // Gated on the token rather than read straight off the query: `endSession`
  // empties the cache outside React's render cycle, and an emptied cache
  // schedules no render, so `meQuery.data` would keep serving the profile of
  // the user who just signed out. The token is state, so losing it does render.
  const user = token === null ? null : (meQuery.data ?? null);

  return {
    status: resolveStatus({ hasCompletedBoot, token, user }),
    user,
    adoptTokens,
    openSession,
    endSession,
  };
};

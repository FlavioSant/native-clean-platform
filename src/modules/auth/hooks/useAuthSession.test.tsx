import { type QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { createQueryClient, reportError } from '@/errors';
import { API_ERROR_CODES, ApiError } from '@/lib';
import { getAuthorizationHandlers } from '@/lib/api/requestInterceptor';

import { fetchMe, refreshSession } from '../api/authApi';
import type { SessionTokens, User } from '../api/schemas';
import { AUTH_QUERY_KEYS } from '../constants';
import { clearRefreshToken, readRefreshToken, writeRefreshToken } from '../storage';
import { AUTH_STATUSES } from '../types';
import { useAuthSession } from './useAuthSession';

const TEST_QUERY_DEFAULTS = {
  queries: { retry: false, gcTime: Infinity },
  mutations: { gcTime: Infinity },
} as const;

jest.mock('../api/authApi');

// Unlike AuthContext.test.tsx, these tests have to land test code at exact
// points inside `refreshAccessToken`'s own awaits (mid-write, mid-request) to
// exercise its `isSuperseded()` checkpoints. The real `expo-secure-store` mock
// in jest.setup.ts resolves on its own schedule, so storage is mocked here
// too, with the same in-memory behavior, to get that control.
jest.mock('../storage', () => ({
  readRefreshToken: jest.fn(),
  writeRefreshToken: jest.fn(),
  clearRefreshToken: jest.fn(),
}));

jest.mock('@/errors', () => ({
  ...jest.requireActual('@/errors'),
  reportError: jest.fn(),
}));

const mockFetchMe = fetchMe as jest.MockedFunction<typeof fetchMe>;
const mockRefreshSession = refreshSession as jest.MockedFunction<typeof refreshSession>;
const mockReadRefreshToken = readRefreshToken as jest.MockedFunction<typeof readRefreshToken>;
const mockWriteRefreshToken = writeRefreshToken as jest.MockedFunction<typeof writeRefreshToken>;
const mockClearRefreshToken = clearRefreshToken as jest.MockedFunction<typeof clearRefreshToken>;
const mockReportError = reportError as jest.MockedFunction<typeof reportError>;

const ACCESS_TOKEN = 'a-signed-token';
const REFRESH_TOKEN = 'a-refresh-token';
const ROTATED_REFRESH_TOKEN = 'the-next-refresh-token';
const rotatedPair: SessionTokens = {
  accessToken: ACCESS_TOKEN,
  refreshToken: ROTATED_REFRESH_TOKEN,
};
const PROFILE: User = {
  id: '0d3d5d8a-6f2e-4d2e-9f1a-6d0f9a3b5c21',
  email: 'user@example.com',
  emailVerifiedAt: null,
  createdAt: '2026-09-01T12:00:00.000Z',
};

const endedSessionError = () =>
  new ApiError({
    status: 401,
    code: API_ERROR_CODES.INVALID_REFRESH_TOKEN,
    message: 'never rendered',
  });

const networkFailure = () =>
  new ApiError({
    status: 0,
    code: API_ERROR_CODES.NETWORK_ERROR,
    message: 'never rendered',
  });

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
};

// Backs the mocked storage with the same shape the real in-memory
// `expo-secure-store` gives every other auth test, so a test that does not
// care about timing still gets realistic persistence.
let storedRefreshToken: string | null = null;

const renderUseAuthSession = async (
  queryClient: QueryClient = createQueryClient(TEST_QUERY_DEFAULTS),
) => {
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const view = await renderHook(() => useAuthSession(), { wrapper });

  return { ...view, queryClient };
};

/** Most tests need boot out of the way before driving the hook by hand. */
const renderSignedOut = async () => {
  const view = await renderUseAuthSession();
  await waitFor(() => expect(view.result.current.status).toBe(AUTH_STATUSES.SIGNED_OUT));

  return view;
};

const requireHandlers = () => {
  const handlers = getAuthorizationHandlers();

  if (handlers === null) {
    throw new Error('useAuthSession did not register authorization handlers.');
  }

  return handlers;
};

/** Mirrors how the API client itself drives the registered handler. */
const requestRefresh = async () => {
  let outcome: string | null = null;

  await act(async () => {
    outcome = await requireHandlers().refreshAccessToken();
  });

  return outcome;
};

beforeEach(() => {
  jest.clearAllMocks();
  storedRefreshToken = null;
  mockReadRefreshToken.mockImplementation(async () => storedRefreshToken);
  mockWriteRefreshToken.mockImplementation(async (token: string) => {
    storedRefreshToken = token;
  });
  mockClearRefreshToken.mockImplementation(async () => {
    storedRefreshToken = null;
  });
  mockFetchMe.mockResolvedValue(PROFILE);
});

describe('boot', () => {
  it('completes immediately and stays signed out when no refresh token is stored', async () => {
    const { result } = await renderUseAuthSession();

    await waitFor(() => expect(result.current.status).toBe(AUTH_STATUSES.SIGNED_OUT));
    expect(mockRefreshSession).not.toHaveBeenCalled();
  });

  it('does not call refreshSession after unmounting while the stored token is still being read', async () => {
    const deferredRead = createDeferred<string | null>();
    mockReadRefreshToken.mockReturnValueOnce(deferredRead.promise);
    storedRefreshToken = REFRESH_TOKEN;

    const { unmount } = await renderUseAuthSession();
    await unmount();

    await act(async () => {
      deferredRead.resolve(REFRESH_TOKEN);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockRefreshSession).not.toHaveBeenCalled();
    expect(mockReportError).not.toHaveBeenCalled();
  });

  it('does not report the error after unmounting while a refresh is still in flight', async () => {
    storedRefreshToken = REFRESH_TOKEN;
    const deferredRefresh = createDeferred<SessionTokens>();
    mockRefreshSession.mockReturnValueOnce(deferredRefresh.promise);

    const { unmount } = await renderUseAuthSession();
    await waitFor(() => expect(mockRefreshSession).toHaveBeenCalledTimes(1));
    await unmount();

    await act(async () => {
      // Not an ended-session error, so it is the kind that would otherwise
      // reach the boot effect's own catch and call reportError.
      deferredRefresh.reject(networkFailure());
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockReportError).not.toHaveBeenCalled();
  });

  it('clears storage and completes boot signed out when the stored refresh token is rejected', async () => {
    storedRefreshToken = REFRESH_TOKEN;
    mockRefreshSession.mockRejectedValue(endedSessionError());

    const { result } = await renderUseAuthSession();

    await waitFor(() => expect(result.current.status).toBe(AUTH_STATUSES.SIGNED_OUT));
    expect(storedRefreshToken).toBeNull();
    expect(mockFetchMe).not.toHaveBeenCalled();
  });

  it('reports the error and still completes boot when the refresh fails for a network reason', async () => {
    storedRefreshToken = REFRESH_TOKEN;
    mockRefreshSession.mockRejectedValue(networkFailure());

    const { result } = await renderUseAuthSession();

    await waitFor(() => expect(result.current.status).toBe(AUTH_STATUSES.SIGNED_OUT));
    // Not a TanStack Query call, so nothing else would have surfaced this to
    // the user without the boot effect reporting it itself.
    expect(mockReportError).toHaveBeenCalledWith(
      expect.objectContaining({ code: API_ERROR_CODES.NETWORK_ERROR }),
    );
    // Offline at launch keeps the token for the next attempt.
    expect(storedRefreshToken).toBe(REFRESH_TOKEN);
  });

  it('completes boot through the profile query when the stored refresh token is spent successfully', async () => {
    storedRefreshToken = REFRESH_TOKEN;
    mockRefreshSession.mockResolvedValue(rotatedPair);

    const { result } = await renderUseAuthSession();

    // Boot itself never calls setHasCompletedBoot for a non-null token — it
    // hands off to meQuery, which is what this asserts.
    await waitFor(() => expect(result.current.status).toBe(AUTH_STATUSES.SIGNED_IN));
    expect(result.current.user).toEqual(PROFILE);
    expect(storedRefreshToken).toBe(ROTATED_REFRESH_TOKEN);
  });
});

describe('refreshAccessToken', () => {
  it('ends the session and resolves null when there is no stored refresh token', async () => {
    await renderSignedOut();

    const outcome = await requestRefresh();

    expect(outcome).toBeNull();
    expect(mockRefreshSession).not.toHaveBeenCalled();
    expect(mockClearRefreshToken).toHaveBeenCalled();
  });

  it('adopts the rotated pair and resolves the new access token when the refresh succeeds', async () => {
    await renderSignedOut();
    storedRefreshToken = REFRESH_TOKEN;
    mockRefreshSession.mockResolvedValue(rotatedPair);

    const outcome = await requestRefresh();

    expect(outcome).toBe(ACCESS_TOKEN);
    expect(mockWriteRefreshToken).toHaveBeenCalledWith(ROTATED_REFRESH_TOKEN);
    expect(requireHandlers().getAccessToken()).toBe(ACCESS_TOKEN);
  });

  it('propagates a non-session error from the refresh and leaves the session untouched', async () => {
    await renderSignedOut();
    storedRefreshToken = REFRESH_TOKEN;
    mockRefreshSession.mockRejectedValue(networkFailure());

    await expect(requestRefresh()).rejects.toMatchObject({
      code: API_ERROR_CODES.NETWORK_ERROR,
    });

    // Being offline is not a reason to sign the user out.
    expect(mockClearRefreshToken).not.toHaveBeenCalled();
    expect(storedRefreshToken).toBe(REFRESH_TOKEN);
  });

  describe('when a sign-out races the refresh', () => {
    it('resolves null without ever calling refreshSession, when the sign-out lands right after the token read', async () => {
      const { result } = await renderSignedOut();
      storedRefreshToken = REFRESH_TOKEN;

      let outcome: string | null = 'not yet resolved';

      await act(async () => {
        const refreshPromise = requireHandlers().refreshAccessToken();
        // Runs synchronously up to its own first await, so this bumps
        // sessionEpochRef before refreshAccessToken's pending `readRefreshToken()`
        // call comes back and checks it — the earliest point the race can land.
        const endPromise = result.current.endSession();

        outcome = await refreshPromise;
        await endPromise;
      });

      expect(outcome).toBeNull();
      expect(mockRefreshSession).not.toHaveBeenCalled();
    });

    it('resolves null and never adopts the new tokens, when the sign-out lands right after refreshSession resolves', async () => {
      const { result } = await renderSignedOut();
      storedRefreshToken = REFRESH_TOKEN;
      const deferredRefresh = createDeferred<SessionTokens>();
      mockRefreshSession.mockReturnValueOnce(deferredRefresh.promise);

      const refreshPromise = requireHandlers().refreshAccessToken();
      await waitFor(() => expect(mockRefreshSession).toHaveBeenCalledTimes(1));

      let outcome: string | null = 'not yet resolved';

      await act(async () => {
        const endPromise = result.current.endSession();
        deferredRefresh.resolve(rotatedPair);
        outcome = await refreshPromise;
        await endPromise;
      });

      expect(outcome).toBeNull();
      // The rotated pair the answer carried must never reach adoptTokens.
      expect(mockWriteRefreshToken).not.toHaveBeenCalledWith(ROTATED_REFRESH_TOKEN);
      expect(storedRefreshToken).toBeNull();
    });

    it('ends the session again to wipe the token adoptTokens already persisted, when the sign-out lands mid-adoption', async () => {
      const { result } = await renderSignedOut();
      storedRefreshToken = REFRESH_TOKEN;
      mockRefreshSession.mockResolvedValueOnce(rotatedPair);
      mockWriteRefreshToken.mockImplementationOnce(async (token: string) => {
        // adoptTokens's own persist is itself an await — a sign-out can land
        // inside it. Simulated here by ending the session from inside the
        // write it is racing, after refreshSession already answered.
        await result.current.endSession();
        storedRefreshToken = token;
      });

      const outcome = await requestRefresh();

      expect(outcome).toBeNull();
      // Two endSession runs: the one this test triggered, and the cleanup the
      // superseded success path must perform for the token it just adopted.
      expect(mockClearRefreshToken).toHaveBeenCalledTimes(2);
      expect(storedRefreshToken).toBeNull();
      expect(requireHandlers().getAccessToken()).toBeNull();
    });

    it('does not end the session a second time when the sign-out already ran before the ended-session rejection is seen', async () => {
      const { result } = await renderSignedOut();
      storedRefreshToken = REFRESH_TOKEN;
      const deferredRefresh = createDeferred<SessionTokens>();
      mockRefreshSession.mockReturnValueOnce(deferredRefresh.promise);

      const refreshPromise = requireHandlers().refreshAccessToken();
      await waitFor(() => expect(mockRefreshSession).toHaveBeenCalledTimes(1));

      let outcome: string | null = 'not yet resolved';

      await act(async () => {
        const endPromise = result.current.endSession();
        deferredRefresh.reject(endedSessionError());
        outcome = await refreshPromise;
        await endPromise;
      });

      expect(outcome).toBeNull();
      // Only the sign-out this test triggered ran — a session that isn't the
      // current one must not be torn down again for dying in the background.
      expect(mockClearRefreshToken).toHaveBeenCalledTimes(1);
    });
  });
});

describe('openSession', () => {
  it('persists the token and waits for the profile before resolving', async () => {
    const { result } = await renderSignedOut();

    await act(async () => {
      await result.current.openSession({ accessToken: ACCESS_TOKEN, refreshToken: REFRESH_TOKEN });
    });

    expect(storedRefreshToken).toBe(REFRESH_TOKEN);
    expect(result.current.status).toBe(AUTH_STATUSES.SIGNED_IN);
    expect(result.current.user).toEqual(PROFILE);
  });
});

describe('adoptTokens', () => {
  it('persists the refresh token and applies the access token without waiting for a profile fetch', async () => {
    const { result } = await renderSignedOut();
    const deferredMe = createDeferred<User>();
    mockFetchMe.mockReturnValueOnce(deferredMe.promise);

    await act(async () => {
      await result.current.adoptTokens({ accessToken: ACCESS_TOKEN, refreshToken: REFRESH_TOKEN });
    });

    expect(storedRefreshToken).toBe(REFRESH_TOKEN);
    expect(requireHandlers().getAccessToken()).toBe(ACCESS_TOKEN);
    // adoptTokens resolved above while the profile fetch it triggered as a
    // side effect (meQuery turning on) is still pending — proof it never
    // awaited it itself.
    expect(mockFetchMe).toHaveBeenCalled();

    await act(async () => {
      deferredMe.resolve(PROFILE);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  });
});

describe('endSession', () => {
  it('clears storage, resets the token, and empties the me and sessions caches', async () => {
    const queryClient = createQueryClient(TEST_QUERY_DEFAULTS);
    queryClient.setQueryData(AUTH_QUERY_KEYS.SESSIONS, []);
    const { result } = await renderUseAuthSession(queryClient);
    await waitFor(() => expect(result.current.status).toBe(AUTH_STATUSES.SIGNED_OUT));

    await act(async () => {
      await result.current.adoptTokens({ accessToken: ACCESS_TOKEN, refreshToken: REFRESH_TOKEN });
    });
    expect(storedRefreshToken).toBe(REFRESH_TOKEN);

    await act(async () => {
      await result.current.endSession();
    });

    expect(storedRefreshToken).toBeNull();
    expect(requireHandlers().getAccessToken()).toBeNull();
    expect(queryClient.getQueryData(AUTH_QUERY_KEYS.ME)).toBeUndefined();
    expect(queryClient.getQueryData(AUTH_QUERY_KEYS.SESSIONS)).toBeUndefined();
  });
});

describe('when the profile query reports the token is no longer valid', () => {
  it('ends the local session', async () => {
    mockFetchMe.mockRejectedValue(endedSessionError());

    const { result } = await renderSignedOut();

    await act(async () => {
      await result.current.adoptTokens({ accessToken: ACCESS_TOKEN, refreshToken: REFRESH_TOKEN });
    });

    // The token adoptTokens just persisted is gone again: the rejected profile
    // fetch made the hook end the session it opened.
    expect(mockWriteRefreshToken).toHaveBeenCalledWith(REFRESH_TOKEN);
    await waitFor(() => expect(storedRefreshToken).toBeNull());
  });

  it('reports the error instead of leaving it unhandled when ending the session itself fails', async () => {
    const { result } = await renderSignedOut();
    const keychainError = new Error('keychain delete failed');
    mockClearRefreshToken.mockRejectedValueOnce(keychainError);
    mockFetchMe.mockRejectedValue(endedSessionError());

    await act(async () => {
      await result.current.adoptTokens({ accessToken: ACCESS_TOKEN, refreshToken: REFRESH_TOKEN });
    });

    await waitFor(() => expect(mockReportError).toHaveBeenCalledWith(keychainError));
  });
});

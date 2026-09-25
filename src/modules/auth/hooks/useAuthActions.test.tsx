import { type QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { createQueryClient } from '@/errors';

import { login, logout } from '../api/authApi';
import { readRefreshToken } from '../storage';
import { AUTH_STATUSES } from '../types';
import { useAuthActions } from './useAuthActions';
import type { AuthSessionValue } from './useAuthSession';

const TEST_QUERY_DEFAULTS = {
  queries: { retry: false, gcTime: Infinity },
  mutations: { gcTime: Infinity },
} as const;

jest.mock('../api/authApi');

// useAuthActions only reaches into storage for `readRefreshToken`, to decide
// whether sign-out has anything left to revoke server-side.
jest.mock('../storage', () => ({ readRefreshToken: jest.fn() }));

const mockLogin = login as jest.MockedFunction<typeof login>;
const mockLogout = logout as jest.MockedFunction<typeof logout>;
const mockReadRefreshToken = readRefreshToken as jest.MockedFunction<typeof readRefreshToken>;

const REFRESH_TOKEN = 'a-refresh-token';
const SESSION_TOKENS = { accessToken: 'a-signed-token', refreshToken: REFRESH_TOKEN };
const CREDENTIALS = { email: 'user@example.com', password: 'sup3rS3cret!' };

// This hook takes AuthSessionValue's session primitives directly rather than
// calling useAuthSession itself, so a test double stands in for the whole
// object — only `adoptTokens`, `openSession` and `endSession` are ever read.
const createSessionValue = (overrides: Partial<AuthSessionValue> = {}): AuthSessionValue => ({
  status: AUTH_STATUSES.SIGNED_OUT,
  user: null,
  adoptTokens: jest.fn(),
  openSession: jest.fn(),
  endSession: jest.fn(),
  ...overrides,
});

const renderAuthActions = async (
  session: AuthSessionValue,
  queryClient: QueryClient = createQueryClient(TEST_QUERY_DEFAULTS),
) => {
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const view = await renderHook(() => useAuthActions(session), { wrapper });

  return { ...view, queryClient };
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('signOut', () => {
  it('skips the logout call when there is no stored refresh token, but still ends the session', async () => {
    mockReadRefreshToken.mockResolvedValue(null);
    const endSession = jest.fn().mockResolvedValue(undefined);
    const { result } = await renderAuthActions(createSessionValue({ endSession }));

    await act(async () => {
      await result.current.signOut();
    });

    // Nothing was issued for this device, so there is nothing to revoke.
    expect(mockLogout).not.toHaveBeenCalled();
    // The teardown itself — token, query cache, keychain — belongs to
    // `endSession`, and useAuthSession.test.tsx is what asserts it.
    expect(endSession).toHaveBeenCalledTimes(1);
  });

  it('resolves even when ending the session itself fails', async () => {
    mockReadRefreshToken.mockResolvedValue(REFRESH_TOKEN);
    mockLogout.mockResolvedValue(undefined);
    const endSession = jest.fn().mockRejectedValue(new Error('keychain delete failed'));
    const { result } = await renderAuthActions(createSessionValue({ endSession }));

    // The whole mutation is documented as "nothing here may reject" — a
    // keychain delete failure must not surface to the caller.
    await act(async () => {
      await expect(result.current.signOut()).resolves.toBeUndefined();
    });

    expect(endSession).toHaveBeenCalledTimes(1);
  });
});

describe('signIn', () => {
  it('rejects with the original openSession failure, not the rollback endSession failure', async () => {
    mockLogin.mockResolvedValue(SESSION_TOKENS);
    const openSessionError = new Error('profile fetch failed');
    const openSession = jest.fn().mockRejectedValue(openSessionError);
    const endSession = jest.fn().mockRejectedValue(new Error('rollback keychain failure'));
    const { result } = await renderAuthActions(createSessionValue({ openSession, endSession }));

    const callSignIn = async () => {
      await act(async () => {
        await result.current.signIn(CREDENTIALS);
      });
    };

    // The rollback's own failure is swallowed — the caller needs the failure
    // that made the rollback necessary, not the one it hit on the way out.
    await expect(callSignIn()).rejects.toBe(openSessionError);
    expect(endSession).toHaveBeenCalledTimes(1);
  });
});

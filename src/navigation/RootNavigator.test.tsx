import { QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { type Metrics, SafeAreaProvider } from 'react-native-safe-area-context';

import { createQueryClient, ErrorToastProvider } from '@/errors';
import { api } from '@/lib';
import { AuthProvider } from '@/modules/auth';

import { RootNavigator } from './RootNavigator';

/**
 * Real provider, real screens, real API functions: only `api` — the edge of the
 * network — is replaced. The gate is then tested through what it is for
 * (opening a session, restoring one, ending one) rather than through a mocked
 * `useAuth` that could report any status the provider never would.
 */
const mockPost = jest.spyOn(api, 'post');
const mockGet = jest.spyOn(api, 'get');

/** The key `src/modules/auth/constants.ts` writes; the test seeds the keychain the way the app's storage does. */
const REFRESH_TOKEN_KEY = 'auth.refreshToken';
const STORED_REFRESH_TOKEN = 'a-refresh-token-from-the-last-launch';

const CREDENTIALS = { email: 'user@example.com', password: 'sup3rS3cret!' };
const TOKENS = { accessToken: 'an-access-token', refreshToken: 'the-rotated-refresh-token' };
const PROFILE = {
  id: '0d3d5d8a-6f2e-4d2e-9f1a-6d0f9a3b5c21',
  email: CREDENTIALS.email,
  emailVerifiedAt: null,
  createdAt: '2026-09-01T12:00:00.000Z',
};

/** `initialMetrics` skips the native measurement, which never resolves under Jest. */
const SAFE_AREA_METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const answerPost = (refresh: () => Promise<unknown> = async () => TOKENS) => {
  mockPost.mockImplementation((async (path: string) => {
    switch (path) {
      case '/auth/login':
        return TOKENS;
      case '/auth/refresh':
        return refresh();
      case '/auth/logout':
        return null;
      default:
        throw new Error(`Unexpected POST ${path}`);
    }
  }) as never);
};

/** Same nesting as `App.tsx`: the navigator needs the session, the toast and the safe area above it. */
const renderNavigator = async () =>
  render(
    <QueryClientProvider
      client={createQueryClient({
        queries: { retry: false, gcTime: Infinity },
        mutations: { gcTime: Infinity },
      })}
    >
      <SafeAreaProvider initialMetrics={SAFE_AREA_METRICS}>
        <ErrorToastProvider>
          <AuthProvider>
            <RootNavigator />
          </AuthProvider>
        </ErrorToastProvider>
      </SafeAreaProvider>
    </QueryClientProvider>,
  );

const givenStoredSession = async () => {
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, STORED_REFRESH_TOKEN);
};

beforeEach(async () => {
  jest.clearAllMocks();
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  answerPost();
  mockGet.mockImplementation((async (path: string) => {
    if (path === '/auth/me') {
      return PROFILE;
    }

    throw new Error(`Unexpected GET ${path}`);
  }) as never);
});

describe('RootNavigator', () => {
  it('renders the auth stack when nobody is signed in', async () => {
    await renderNavigator();

    expect(await screen.findByText('Welcome back')).toBeTruthy();
    expect(screen.queryByText('Signed-in area')).toBeNull();
  });

  it('swaps in the app stack once the user signs in', async () => {
    await renderNavigator();
    await screen.findByText('Welcome back');

    await fireEvent.changeText(screen.getByLabelText('Email'), CREDENTIALS.email);
    await fireEvent.changeText(screen.getByLabelText('Password'), CREDENTIALS.password);
    await fireEvent.press(screen.getByText('Sign in'));

    expect(await screen.findByText('Signed-in area')).toBeTruthy();
    expect(screen.queryByText('Welcome back')).toBeNull();
  });

  it('shows the splash, and neither stack, while a stored session is being verified', async () => {
    await givenStoredSession();
    let resolveRefresh: (tokens: unknown) => void = () => undefined;
    answerPost(
      () =>
        new Promise((resolve) => {
          resolveRefresh = resolve;
        }),
    );

    await renderNavigator();

    expect(screen.getByLabelText('Loading')).toBeTruthy();
    expect(screen.queryByText('Welcome back')).toBeNull();
    expect(screen.queryByText('Signed-in area')).toBeNull();

    await act(async () => {
      resolveRefresh(TOKENS);
    });

    expect(await screen.findByText('Signed-in area')).toBeTruthy();
  });

  it('returns to the sign-in screen after signing out, with the app stack gone', async () => {
    await givenStoredSession();

    await renderNavigator();
    await screen.findByText('Signed-in area');
    await fireEvent.press(screen.getByText('Account'));
    await fireEvent.press(await screen.findByText('Sign out'));

    expect(await screen.findByText('Welcome back')).toBeTruthy();
    expect(screen.queryByText('Signed-in area')).toBeNull();
  });
});

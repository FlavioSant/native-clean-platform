import { REFRESH_TOKEN_STORAGE_KEY } from './constants';

const UNSUPPORTED_WEB_TARGET_MESSAGE =
  'The web target keeps the refresh token in localStorage, where any script on ' +
  'the origin can read it. It is a development convenience only: ship the ' +
  'native builds, or give the web target cookie transport before releasing one.';

/**
 * Split from the call below so the failure is testable without re-importing the
 * module — the same shape `src/config/env.ts` uses for its own boot guard.
 */
export const assertWebStorageIsAllowed = (isDevelopment: boolean = __DEV__): void => {
  if (!isDevelopment) {
    throw new Error(UNSUPPORTED_WEB_TARGET_MESSAGE);
  }
};

// At import time, on purpose: a release web bundle has to die at boot rather
// than at its first sign-in, by which point a refresh token any script on the
// origin can read is already there.
assertWebStorageIsAllowed();

/**
 * `expo-secure-store` has no web implementation, and this repo supports
 * `pnpm web`. `localStorage` is NOT equivalent: it is readable by any script on
 * the origin, which is what the guard above refuses to ship.
 */
export const readRefreshToken = async (): Promise<string | null> =>
  globalThis.localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);

export const writeRefreshToken = async (token: string): Promise<void> => {
  globalThis.localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, token);
};

export const clearRefreshToken = async (): Promise<void> => {
  globalThis.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
};

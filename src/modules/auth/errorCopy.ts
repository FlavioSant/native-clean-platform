import { API_ERROR_CODES } from '@/lib';

/**
 * This module's domain codes only. Everything a module can receive whatever it
 * asked for — network, 500, 429, a drifted contract — lives in `@/errors`, and
 * `App.tsx` registers this map there.
 */
export const AUTH_ERROR_COPY = {
  [API_ERROR_CODES.INVALID_CREDENTIALS]: 'Email or password is incorrect.',
  [API_ERROR_CODES.INVALID_REFRESH_TOKEN]: 'Your session has expired. Please sign in again.',
  [API_ERROR_CODES.REFRESH_TOKEN_REUSED]:
    'Your session was ended for security. Please sign in again.',
  /** One message for four failures: the API answers one code, and guessing between them would return the oracle it withheld. */
  [API_ERROR_CODES.EMAIL_VERIFICATION_FAILED]:
    'That code is not valid. Request a new one and try again.',
  /** Same reasoning: one code for unknown, wrong, expired and already used. */
  [API_ERROR_CODES.PASSWORD_RESET_FAILED]:
    'That token is not valid. Start the recovery again to get a new one.',
  /** Copy only: no route out in the app (see "EMAIL_NOT_VERIFIED" in the module README). */
  [API_ERROR_CODES.EMAIL_NOT_VERIFIED]:
    'Confirm your email address before signing in. Check your inbox.',
  [API_ERROR_CODES.INVALID_CURRENT_PASSWORD]: 'That is not your current password.',
  [API_ERROR_CODES.PASSWORD_UNCHANGED]: 'Choose a password different from your current one.',
  [API_ERROR_CODES.USER_NOT_FOUND]: 'That account no longer exists.',
  [API_ERROR_CODES.INVALID_EMAIL]: 'That email address is not valid.',
  [API_ERROR_CODES.INVALID_PASSWORD]: 'That password does not meet the requirements.',
} as const;
